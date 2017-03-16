abort('Please run this using `bundle exec rake`') unless ENV["BUNDLE_BIN_PATH"]
require 'lightning_sites' # https://github.com/fulldecent/lightning-sites

@source_dir = '.'
@build_excludes.push('README.md','LICENSE','CONTRIBUTING.md')
production_base = 'pacmed10@167.88.160.175:'
@remote_dir = "#{production_base}www"
@backup_targets = {
  'www' => "#{production_base}www",
  'logs' => "#{production_base}logs"
}

desc "Perform website build"
task :build => ['rsync:copy_build', 'git:save_version']

desc "Perform all testing on the built HTML"
task :test => [:build, 'html:check']

desc "Publish website to productions server"
task :publish => ['rsync:push']
