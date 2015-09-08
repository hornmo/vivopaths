use strict;
use warnings;
use utf8;
use Path::Class;
use Cpanel::JSON::XS qw(encode_json decode_json);
use open ':encoding(utf8)';
use open qw/:std :utf8/;
binmode(STDOUT, ":utf8");

my $filename = 'merged_json.json';
my $output = 'fixed_json.json';
my $file = file($output);
my $output_handler = $file->openw();
my $test = 'ü';

my $json;
{
  local $/; #Enable 'slurp' mode
  open my $fh, "<:utf8", $filename;
  $json = <$fh>;
  close $fh;
}
my $enable = 'true';
$json = $json->utf8 ([$enable]);
my $enabled = $json->get_utf8;
# my $data = decode_json($json);
$output_handler->print($enabled);