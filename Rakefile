# Uses rake tasks from https://github.com/fulldecent/Sites
abort('Please run this using `bundle exec rake`') unless ENV["BUNDLE_BIN_PATH"]
require 'lightning_sites'
require 'shellwords'
# encoding: UTF-8 # https://stackoverflow.com/a/2105210/300224

##
## SETUP BUILD TASK
##

desc "Perform website build"
task :build do
  puts ''
  puts ' 🔨  Building your website'.blue
  puts ''
  Rake::Task['rsync:copy_build'].invoke
  Rake::Task['git:save_version'].invoke
end


##
## SETUP DEPLOYMENT VARIABLES
##
production_base = 'horseslov@172.16.11.23:'
@production_dir = "#{production_base}www"
@production_backup_targets = {
  'www' => "#{production_base}www",
  'logs' => "#{production_base}logs"
}


##
## CONFIGURE TESTING TASKS
## See more options at https://github.com/fulldecent/Sites
##

desc "Perform validation testing for this website's code"
task :test => [] do
  puts "To run even more tests, which may be expensive, also run text_extensive"
end

desc "Perform more tests with extensive time, bandwidth or other cost"
task :text_extensive do

end


##
## CONFIGURE DEPLOYMENT TASKS
## See more options at https://github.com/fulldecent/Sites
##

desc "This is a task using code from the included library"
task :deploy => ['git:helloworld']

#task :default => :deploy


##
## CONFIGURE STATUS CHECK TASKS, THIS IS THE DEFAULT TASK FOR `bundle exec rake`
## See more options at https://github.com/fulldecent/Sites
##


desc "Show all the tasks"
task :default do
  # http://stackoverflow.com/a/1290119/300224
  Rake::Task["git:status"].invoke

  puts 'TODO: make a note here about whether there are local changes not yet committed'
  puts 'TODO: make a note here about whether there are remote changes not yet merged'

  puts ''
  puts 'Here are all available namespaced rake tasks:'.blue
  Rake::application.options.show_tasks = :tasks  # this solves sidewaysmilk problem
  Rake::application.options.show_task_pattern = /:/
  Rake::application.display_tasks_and_comments

  puts ''
  puts 'Here are all available local rake tasks:'.blue
  Rake::application.options.show_tasks = :tasks  # this solves sidewaysmilk problem
  Rake::application.options.show_task_pattern = /^[^:]*$/
  Rake::application.display_tasks_and_comments
end

desc "Show all the tasks 2 "
task :default do
  puts "OVERRIDE"
end
