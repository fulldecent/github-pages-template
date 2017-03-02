require 'colorize'

# http://stackoverflow.com/a/11320444/300224
Rake::TaskManager.record_task_metadata = true

##
## EVERY SITE MUST DEFINE THESE VARIABLES:
##
@source_dir = 'source'       # Editable source code
@build_dir = 'build'         # Built HTML code
##
##
## REQUIRED VARIABLES FOR DEPLOYMENT:
##
## @production_dir             A local or remote directory (rsync format) to deploy to
##                             Good example: 'horseslov@172.16.11.23:/www'
## @production_backup_targets  Hash of {name => what_should_backup_to_there}
##                             Good example: {'logs' => 'horseslov@172.16.11.23:/logs', ...}
@production_backup_dir = 'production_backups'

##
## COLOR SCHEME
##
## ...
##

module LightningSites
  # Your code goes here...
end

# Note: this stuff works even if only your SOURCE_DIR is checked into git
namespace :git do
  def source_dir_is_git?
    return false if !File.directory?(@source_dir)
    return system("cd #{@source_dir} && git rev-parse --git-dir > /dev/null 2> /dev/null")
  end

  desc "Incorporate changes from the remote repository into the current branch"
  task :pull do
    puts 'Pulling git'.blue
    sh "cd '#{@source_dir}'; git pull"
    puts 'Pulled'.green
  end

  desc "Displays paths that have differences between the index file and the current HEAD commit"
  task :status do
    if !source_dir_is_git?
      puts "There is no git directory, skipping"
      next
    end
    puts 'Here are differences between git\'s index file and the current HEAD commit'.blue
    sh "cd #{@source_dir} && git status --short"
  end

  desc "Print the modified date for all files under source control"
  task :stale_report do
    if !source_dir_is_git?
      puts "There is no git directory, skipping"
      next
    end
    puts 'Modified   File'.blue
    sh "cd #{@source_dir} && git ls-files -z | xargs -0 -n1 -I{} -- git log -1 --date=short --format='%ad {}' {}"
  end

  desc "Save the commit hash to VERSION in the build directory"
  task :save_version do
    if !source_dir_is_git?
      puts "There is no git directory, skipping"
      next
    end
    hash = `cd #{@source_dir} && git rev-parse HEAD`.chomp
    local_changes = `git diff --shortstat`.chomp.length
    File.write("#{@build_dir}/VERSION", local_changes ? "#{hash}*\n" : "#{hash}*")
    puts 'Saved git version to VERSION file'.green
  end
end

## don't use this right now
namespace :jekyll do
  desc "Build Jekyll site"
  task :build do
    puts 'Building Jekyll'.blue
    sh "jekyll build --incremental --source '#{@source_dir}' --destination '#{@build_dir}'"
    puts 'Built'.green
  end

  desc "Run a Jekyll test server"
  task :test do
    puts 'Running test server'.blue
    sh "jekyll serve --source '#{@source_dir}' --destination '#{@build_dir}'"
  end
end

# Interact with a production environment
namespace :rsync do
  desc "Copy the source directory to the build directory"
  task :copy_build do
    puts 'Copying source directory to build directory'.blue
    rsync_opts = '--archive --delete --exclude .git'
    from = "#{@source_dir}/"
    to = "#{@build_dir}/"
    sh "rsync #{rsync_opts} '#{from}' '#{to}'"
    puts 'Copied'.green
  end

  desc "Bring deployed web server files local"
  task :pull do
    raise '@production_dir is not defined' unless defined? @production_dir
    raise '@build_dir is not defined' unless defined? @build_dir
    puts 'Pulling website'.blue
    rsync_opts = '-vr --delete --exclude .git --exclude cache'
    remote = "#{@production_dir}/"
    local = "#{@build_dir}/"
    sh "rsync #{rsync_opts} '#{remote}' '#{local}'"
    puts 'Pulled'.green
  end

  desc "Push local files to production web server"
  task :push do
    raise '@production_dir is not defined' unless defined? @production_dir
    raise '@build_dir is not defined' unless defined? @build_dir
    puts 'Pushing website'.blue
    rsync_opts = '-r -c -v --ignore-times --chmod=ugo=rwX --delete --exclude .git --exclude cache'
    remote = "#{@production_dir}/"
    local = "#{@build_dir}/"
    sh "rsync #{rsync_opts} '#{local}' '#{remote}'"
    puts 'Pushed'.green
  end

  desc "Backup production"
  task :backup do
    raise '@production_backup_dir is not defined' unless defined? @production_backup_dir
    raise '@production_backup_targets is not defined' unless defined? @production_backup_targets
    puts "Backing up production".blue
    rsync_opts = '-vaL --delete --exclude .git'
    @production_backup_targets.each do |local_dir, remote_dir|
      remote = "#{remote_dir}"
      local = "#{@production_backup_dir}/#{local_dir}/"
      sh 'mkdir', '-p', local
      sh "rsync #{rsync_opts} '#{remote}' '#{local}'"
    end
    puts "Backup complete".green
  end
end

# beta stuff
namespace :seo do
  desc "Find 404s"
  task :find_404 do
    puts "Finding 404 errors".blue
    sh 'zgrep', '-r', ' 404 ', "#{@production_backup_dir}/logs"
#    sh "zgrep -r ' 404 ' '#{@production_backup_dir}/logs'"
    puts "Found".green
  end

  desc "Find 301s"
  task :find_301 do
    puts "Finding 301 errors".blue
    sh "zgrep -r ' 301 ' '#{@production_backup_dir}/logs'"
    puts "Found".green
  end
end

# testing stuff for built html folder
namespace :html do
  desc "Checks HTML with htmlproofer, excludes offsite broken link checking"
  task :check_onsite do
    puts "⚡️  Checking HTML".blue
    sh "bundle exec htmlproofer --disable-external --check-html --checks-to-ignore ScriptCheck,LinkCheck,HtmlCheck #{@build_dir} > /dev/null || true"
    puts "☀️  Checked HTML".green
  end

  desc "Checks links with htmlproofer"
  task :check_links do
    puts "⚡️  Checking links".blue
    sh "bundle exec htmlproofer --checks-to-ignore ScriptCheck,ImageCheck #{@build_dir} || true"
    puts "☀️  Checked HTML".green
  end

  desc "Find all external links"
  task :find_external_links do
    puts "⚡️  Finding all external links".blue
    sh "egrep -oihR '\\b(https?|ftp|file)://[-A-Z0-9+@/%=~_|!:,.;]*[A-Z0-9+@/%=~_|]' #{@build_dir} || true"
  end
end

desc "Delete all built code"
task :clean do
  puts "Deleting all built code".red
  FileUtils.rm_rf(@build_dir)
  FileUtils.rm_rf(@production_backup_dir)
  puts "Deleting complete".green
end

desc "Delete everything that can be regenerated"
task :distclean do
  puts "Deleting all built code".red
  FileUtils.rm_rf(@build_dir)
  puts "Deleting all productions backups".red
  FileUtils.rm_rf(@production_backup_dir)
  puts "Deleting complete".green
end

desc "Show all the tasks"
task :default do
  puts ''
  puts '⚡️ THIS RAKEFILE USES LIGHTNING SITES'.blue
  puts ''

  # http://stackoverflow.com/a/1290119/300224
  Rake::Task["git:status"].invoke

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
