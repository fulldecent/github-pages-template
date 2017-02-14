require 'colorize'

module LightningSites
  # Your code goes here...
end

namespace :git do
  desc "prints"
  task :helloworld do
    puts 'helloworld'.light_red
  end
end
