package EP::DocPlugin;
use strict;  
use warnings;

# based on Mojolicious::Plugin::PodRenderer

use Mojo::Base 'Mojolicious::Plugin';

use File::Basename 'dirname';
use File::Spec;
use IO::File;
use Mojo::Asset::File;
use Mojo::ByteStream 'b';
use Mojo::DOM;
use Mojo::Util 'url_escape';
use EP::Config;
use Pod::Simple::HTML;
use Pod::Simple::Search;

# Paths
our @PATHS = map { ($_ , "$_/pods") } @INC;

# "This is my first visit to the Galaxy of Terror and I'd like it to be a
#  pleasant one."
sub register {
  my ($self, $app, $conf) = @_;
  # Config
  $conf ||= {};
  my $name       = $conf->{name}       || 'pod';
  my $preprocess = $conf->{preprocess} || 'ep';
  my $localguide = $conf->{localguide};
  my $index      = $conf->{index}      || die 'index attribute is required';
  my $root       = $conf->{root}       || die 'root attribute is required';
  my $template   = $conf->{template}   || die 'template attribute is required';
    
  # Add "pod" handler
  $app->renderer->add_handler(
    $name => sub {
      my ($r, $c, $output, $options) = @_;

      # Preprocess with ep and then render
      return unless $r->handlers->{$preprocess}->($r, $c, $output, $options);
      $$output = _pod_to_html($$output)
    }
  );

  # Add "pod_to_html" helper
  $app->helper(pod_to_html => sub { shift; b(_pod_to_html(@_)) });

  # Perldoc
  $app->routes->any(
      $root.'/(*module)' => { module => $index } => sub {
      my $self = shift;

      # Find module
      my $module = $self->param('module');
      my $html;
      my $cpan = 'http://search.cpan.org/perldoc';
      $module =~ s/\//\:\:/g;      
      if ($module eq 'EP::Cfg'){
          $html = _pod_to_html(EP::Config->make_pod);
      }
      else {
          my $path;
          if ($module eq 'EP::LocalGuide'){
              if ($localguide and -r $localguide){
                 $path = $localguide;
              } else {
                 return $self->render(text=>'You got no Local Guide. Configure your localguide path in extopus.cfg and make sure the extopus backend can read the file.',status => 404);
              }
          } else {
              $path = Pod::Simple::Search->new->find($module, @PATHS);
          }
          # Redirect to CPAN
          return $self->redirect_to("$cpan?$module")
                unless $path && -r $path;

          # Turn POD into HTML
          my $file = IO::File->new;
          $file->open("< $path");
          $html = _pod_to_html(join '', <$file>);
      }
      # Rewrite links
      my $dom     = Mojo::DOM->new("$html");
      my $perldoc = $self->url_for($root.'/');
      $dom->find('a[href]')->each(
        sub {
          my $attrs = shift->attrs;
          if ($attrs->{href} =~ /^$cpan/) {
            $attrs->{href} =~ s/^$cpan\?/$perldoc/;
            $attrs->{href} =~ s/%3A%3A/\//gi;
          }
        }
      );

      # Rewrite code sections for syntax highlighting
#      $dom->find('pre')->each(
#        sub {
#          my $attrs = shift->attrs;
#          my $class = $attrs->{class};
#          $attrs->{class} =
#            defined $class ? "$class prettyprint lang-perl" : 'prettyprint lang-perl';
#        }
#      );

      # Rewrite headers
      my $url = $self->req->url->clone;
      $url =~ s/%2F/\//gi;
      my $sections = [];
      $dom->find('h1, h2, h3')->each(
        sub {
          my $tag    = shift;
          my $text   = $tag->all_text;
          my $anchor = $text;
          $anchor =~ s/\s+/_/g;
          url_escape $anchor, 'A-Za-z0-9_';
          $anchor =~ s/\%//g;
          push @$sections, [] if $tag->type eq 'h1' || !@$sections;
          push @{$sections->[-1]}, $text, $url->fragment($anchor)->to_abs;
          $tag->replace_content(
            $self->link_to(
              $text => $url->fragment('toc')->to_abs,
              class => 'mojoscroll',
              id    => $anchor
            )
          );
        }
      );

      # Try to find a title
      my $title = 'Perldoc';
      $dom->find('h1 + p')->first(sub { $title = shift->text });

      # Combine everything to a proper response
      $self->content_for(perldoc => "$dom");
      $self->content_for(index_link => $root.'/');
      # $self->app->plugins->run_hook(before_perldoc => $self);
      $self->render(
        inline   => $template,
        title    => $title,
        sections => $sections
      );
      $self->res->headers->content_type('text/html;charset="UTF-8"');
    }
  );
  return;
}

sub _pod_to_html {
  my $pod = shift;
  return unless defined $pod;

  # Block
  $pod = $pod->() if ref $pod eq 'CODE';

  # Parser
  my $parser = Pod::Simple::HTML->new;
  $parser->force_title('');
  $parser->html_header_before_title('');
  $parser->html_header_after_title('');
  $parser->html_footer('');   
  $parser->index(0);

  # Parse
  my $output;
  $parser->output_string(\$output);
  eval { $parser->parse_string_document("$pod") };
  return $@ if $@;

  # Filter
  $output =~ s/<a name='___top' class='dummyTopAnchor'\s*?><\/a>\n//g;
  $output =~ s/<a class='u'.*?name=".*?"\s*>(.*?)<\/a>/$1/sg;

  return $output;
}

1;

__END__

=head1 NAME

EP::DocPlugin - Extopus Documentation Plugin

=head1 SYNOPSIS

  $self->plugin('EP::DocPlugin',{
      root => '/doc',
      index => 'EP::Index',
      template => $self->home->rel_file('templates/doc.html.ep')->slurp
  }); 

=head1 DESCRIPTION

This is a modified version of L<Mojolicious::Plugin::PodRenderer> to rende
extopus documentation.

=head1 OPTIONS

=head2 C<name>

Handler name.

=head2 C<preprocess>

Handler name of preprocessor.

=head2 C<index>

Name of the page to show when called without module name. (mandatory)

=head2 C<root>

Where to show this in the webtree. (mandatory)

=head2 C<template>

A ep template string to render documentation pages. (mandatory)

=head1 HELPERS

=head2 C<pod_to_html>

  <%= pod_to_html '=head2 lalala' %>
  <%= pod_to_html begin %>=head2 lalala<% end %>

Render POD to HTML.

=head1 METHODS

L<EP::DocPlugin> inherits all methods from
L<Mojolicious::Plugin> and implements the following new ones.

=head2 C<register>

  $plugin->register;

Register renderer in L<Mojolicious> application.

=head1 LICENSE

This program is free software; you can redistribute it and/or modify
it under the terms of the GNU General Public License as published by
the Free Software Foundation; either version 3 of the License, or
(at your option) any later version.

This program is distributed in the hope that it will be useful,
but WITHOUT ANY WARRANTY; without even the implied warranty of
MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the
GNU General Public License for more details.

You should have received a copy of the GNU General Public License
along with this program; if not, write to the Free Software
Foundation, Inc., 675 Mass Ave, Cambridge, MA 02139, USA.

=head1 COPYRIGHT

Copyright (c) 2011 by OETIKER+PARTNER AG. All rights reserved.

=head1 AUTHOR

S<Tobias Oetiker E<lt>tobi@oetiker.chE<gt>>
Based on original code by Sebastian Riedel

=head1 HISTORY

 2011-06-20 to 1.0 first version

=cut
