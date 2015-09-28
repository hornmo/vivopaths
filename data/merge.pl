# use strict;
use warnings;
use utf8;
use Path::Class;
use JSON;
use Data::Dumper;
use Class::Date;
use open ':encoding(utf8)';
use open qw/:std :utf8/;
binmode(STDOUT, ":utf8");

my $date = new Class::Date;
my $sparql_authors = 'spql_authors.json';
my $sparql_publications = file('spql_pubs.json');
my $sparql_keywords = file('spql_keywords.json');
my $sparql_keywords = file('spql_projects.json');
my $out = file('merged_data - $date.json');
my $output_handler = $out->openw();
my $dump = file('dump_data - $date.json');
my $dump_handler = $dump->openw();

my $encoded_authors = do {
   open(my $json_fh, "<:", $sparql_authors)
      or die("Can't open \$sparql_authors\": $!\n");
   local $/;
   <$json_fh>
};
my $encoded_publications = do {
   open(my $json_fh, "<:", $sparql_publications)
      or die("Can't open \$sparql_publications\": $!\n");
   local $/;
   <$json_fh>
};
my $encoded_keywords = do {
   open(my $json_fh, "<:", $sparql_keywords)
      or die("Can't open \$sparql_keywords\": $!\n");
   local $/;
   <$json_fh>
};
my $encoded_projects = do {
   open(my $json_fh, "<:", $sparql_projects)
      or die("Can't open \$sparql_projects\": $!\n");
   local $/;
   <$json_fh>
};

my $json = JSON->new->utf8;
my $dec_authors = $json->decode($encoded_authors);
my $dec_publications = $json->decode($encoded_publications);
my $dec_keywords = $json->decode($encoded_keywords);
my $dec_projects = $json->decode($encoded_projects);

my %authors;
my %publications;
my %keywords;
my %projects;
my @combined;

my @imp_authors = @{ $dec_authors->{'results'}->{'bindings'} };
my @imp_publications = @{ $dec_publications->{'results'}->{'bindings'} };
my @imp_keywords = @{ $dec_keywords->{'results'}->{'bindings'} };
my @imp_projects = @{ $dec_projects->{'results'}->{'bindings'} };

foreach my $publication (@imp_publications) {
  if($publication->{'authors'}){
    my $id = $publication->{'id'}->{'value'};
    my %lauthors;
    my %lkeywords;
    my $uri_length = rindex($id, '/') + 1;
    $id = substr $id, $uri_length;
    my $title = $publication->{'title'}->{'value'};
    my $count = $publication->{'count'}->{'value'};
    my $uri = $publication->{'uri'}->{'value'};
    my $abstract = $publication->{'abstract'}->{'value'};
    my $year;
    if($publication->{'year'}){
      $year = $publication->{'year'}->{'value'};
      if(length $year > 4){
	$year = substr $year, -4, (length $year)-1;
      }
    }
    my @auths = split('; ', $publication->{'authors'}->{'value'});
    foreach my $a (@auths) {
      my $aid = substr $a, $uri_length, (length $a)-1;
      $lauthors{ $aid } = 1;
    }
    if($publication->{'keywords'}){
      my @keyw = split('; ', $publication->{'keywords'}->{'value'});
      foreach my $key (@keyw) {
	my $kid = substr $key, $uri_length, (length $key)-1;
	$lkeywords{ $kid } = 1;
      }
    }
    $publications{ $id } = { 'id' => $id, 'title' => $title, 'keywords' => { %lkeywords }, 'year' => $year, 'authors'=> { %lauthors }, 'abstract' => $abstract, 'uri' => $uri, 'type' => 1 };
  }
};
foreach my $author (@imp_authors) {
  my $id = $author->{'id'}->{'value'};
  my $uri_length = rindex($id, '/') + 1;
  $id = substr $id, $uri_length;
  my $name = $author->{'name'}->{'value'};
  my @name_parts = split(',  ', $name);
  my $fullname;
  if($name_parts[1]){
    $fullname = "$name_parts[1] $name_parts[0]";
  }else{
    $fullname = "$name_parts[0]";
  }
  my $shortfirst;
  if($name_parts[1]){
    $shortfirst = substr $name_parts[1], 0, 1;
    $name = "$shortfirst $name_parts[0]";
  }else{
    $name = "$name_parts[0]";
  }
  my $image;
  if($author->{'image'}){
    $image = $author->{'image'}->{'value'};
  }
  my $count = $author->{'count'}->{'value'};
  my $uri = $author->{'uri'}->{'value'};
  my @positions;
  if($author->{'positions'}){
    @positions = split('; ', $author->{'positions'}->{'value'});
  }
  my @pubs = split('; ', $author->{'publications'}->{'value'});
  my %lpublications;
  foreach my $pub (@pubs) {
    my $pid = substr $pub, $uri_length, (length $pub)-1;
    if($publications{ $pid }){
      $lpublications{ $pid } = 1;
    }
  }
  $authors{ $id } = { 'id' => $id, 'name' => $name, 'fullname' => $fullname, 'image' => $image, 'positions' => [ @positions ], 'publications' => { %lpublications }, 'count' => $count, 'uri' => $uri, 'type' => 0 };
};
foreach my $keyword (@imp_keywords) {
  my $id = $keyword->{'id'}->{'value'};
  my $uri_length = rindex($id, '/') + 1;
  $id = substr $id, $uri_length;
  my $title = $keyword->{'title'}->{'value'};
  my $count = $keyword->{'count'}->{'value'};
  my $uri = $keyword->{'uri'}->{'value'};
  my @pubs = split('; ', $keyword->{'publications'}->{'value'});
  my %lpublications;
  foreach my $pub (@pubs) {
    my $pid = substr $pub, $uri_length, (length $pub)-1;
    if($publications{ $pid } && $publications{ $pid }{'authors'}){
      $lpublications{ $pid } = 1;
    }
  }
  $keywords{ $id } = { 'id' => $id, 'title' => $title, 'publications' => { %lpublications }, 'count' => $count, 'uri' => $uri, 'type' => 2 };
};

foreach my $project (@imp_projects) {
  my $id = $project->{'id'}->{'value'};
  my $uri_length = rindex($id, '/') + 1;
  $id = substr $id, $uri_length;
  my $title = $project->{'title'}->{'value'};
  my $count = $project->{'count'}->{'value'};
  my $uri = $project->{'uri'}->{'value'};
  my @pubs = split('; ', $project->{'publications'}->{'value'});
  my %lpublications;
  foreach my $pub (@pubs) {
    my $pid = substr $pub, $uri_length, (length $pub)-1;
    if($publications{ $pid } && $publications{ $pid }{'projects'}){
      $lpublications{ $pid } = 1;
    }
  }
  my %lauthors;
  my @auths = split('; ', $publication->{'authors'}->{'value'});
  foreach my $a (@auths) {
    my $aid = substr $a, $uri_length, (length $a)-1;
    $lauthors{ $aid } = 1;
  }
  $keywords{ $id } = { 'id' => $id, 'title' => $title, 'publications' => { %lpublications }, 'count' => $count, 'uri' => $uri, 'type' => 2 };
};

# Additional connections
foreach my $author (%authors){
  my $aid = $author->{'id'};
  my $pubs = $author->{'publications'};
  for my $pub (keys %$pubs){
    foreach my $kw ($publications{ $pub }{'keywords'}){
      foreach my $kid (keys %$kw){
	if(!$authors{ $aid }{'keywords'}{ $kid }){
	  $authors{ $aid }{'keywords'}{ $kid } = $publications{ $pub }{'keywords'}{ $kid };
	}
      }
    }
    foreach my $ca ($publications{ $pub }{'authors'}){
      foreach my $caid (keys %$ca){
	if(!$authors{ $aid }{'authors'}{ $caid }){
	  $authors{ $aid }{'authors'}{ $caid } = $publications{ $pub }{'authors'}{ $caid };
	}
      }
    }
  };
}
foreach my $keyword (%keywords){
  my $kid = $keyword->{'id'};
  my $pubs = $keyword->{'publications'};
  for my $pub (keys %$pubs){
    if($publications{ $pub }{'authors'}){
      foreach my $a ($publications{ $pub }{'authors'}){
	foreach my $aid (keys %$a){
	  if(!$keywords{ $kid }{'authors'}{ $aid }){
	    $keywords{ $kid }{'authors'}{ $aid } = $publications{ $pub }{'authors'}{ $aid };
	  }
	}
      }
      foreach my $ck ($publications{ $pub }{'keywords'}){
	foreach my $ckid (keys %$ck){
	  if(!$keywords{ $kid }{'keywords'}{ $ckid }){
	    $keywords{ $kid }{'keywords'}{ $ckid } = $publications{ $pub }{'keywords'}{ $ckid };
	  }
	}
      }
    }
  };
}
# print $dump_handler Dumper(%keywords);
$combined[0]{'authors'} = \%authors;
$combined[0]{'publications'} = \%publications;
$combined[0]{'keywords'} = \%keywords;

my @final = $json->pretty->encode(@combined);
$output_handler->print(@final);
# print $output_handler Dumper(@combined);
