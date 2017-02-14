# Uses rake tasks from https://github.com/fulldecent/Sites
require 'lightning_sites'

desc "This is a task using code from the included library"
task :deploy => ['git:helloworld']

task :default => :deploy

desc "Perform validation testing for this website's code"
task :test => [] do

  puts "To run even more tests, which may be expensive, also run text_extensive"
end

desc "Perform more tests with extensive time, bandwidth or other cost"
task :text_extensive do

end
