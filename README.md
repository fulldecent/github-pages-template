# HTML Website Template
Use this template as a starting point for any HTML website project that you want other people to collaborate on.

**STATUS: This project is actively used in production environments.**

![screen shot 2017-03-16 at 6 18 48 pm](https://cloud.githubusercontent.com/assets/382183/24020995/10551b8a-0a75-11e7-812a-9999fc12c2e2.png)

## Features

Your new HTML website will immediately have publishable and documented code, and all these features:

 - Deploy using `rake` (and you don't need to be a nerd to use it)
 - Clean folder structure
 - Testing as a standard
 - Turnkey access to Travis CI
 - HTTPS by default
 - Documentation for contributors

## How to use this

First clone or [download a release](https://github.com/fulldecent/html-website-template/releases), that is the starting point for your site.

THIS LIST IS EASY, CHECK IT OFF ONE-BY-ONE BABY!

 - [ ] Open `index.html` in your favorite text editor and make a great web page, add other content if necessary.
 - [ ] Fix all validation testing errors (see **Build instructions**, below)
 - [ ] Upload your website source code to GitHub or other collaboration point
 - [ ] Enable Travis CI validation testing for your repository
 - [ ] Replace all details below, inspire people to contribute to your project.
 - [ ] Update the release script in `Rakefile` with details to publish to your server.
 - [ ] Delete all this crap up here.
 - [ ] Publish the site (full steps are under **Deploy** below in case you forget)
 - [ ] Set up HTTPS on your website, some [hints are here](https://github.com/fulldecent/html-website-template/wiki/How-to-set-up-HTTPS)

THEN YOU'RE DONE, GO STAR [html-website-template](https://github.com/fulldecent/html-website-template) FOR UPDATES.

---

# My First Website About Horses

[![CI Status](http://img.shields.io/travis/fulldecent/html-website-template.svg?style=flat)](https://travis-ci.org/fulldecent/html-website-template)

This website is published at https://example.com/horses/

![screen shot 2017-03-16 at 6 30 58 pm](https://cloud.githubusercontent.com/assets/382183/24021325/cb3aaa9a-0a76-11e7-8182-6138b1d3c0c2.png)

## Mission

This website exists to help educate the world about horses. There are so many kinds of horses and they are all just so magical. After you read these pages you will definitely want to get one for yourself!

## Build instructions

We test and publish this website using a few simple tools. Please set up these tools to contribute seriously to our project:

1. Use the command line and install `ruby` on your computer (installed by default on macOS and all Linux versions)
2. `gem install bundler`
3. `export NOKOGIRI_USE_SYSTEM_LIBRARIES=true`
3. `bundle install --path vendor/bundle`

Now you are done setting up. Use this command to build the website.

```sh
bundle exec rake build
```

You can now access the website by pointing your browser to the `BUILD` folder or running a command like `cd BUILD; php -S localhost:8000`.

Also, you can check for common problem on our website automatically, just run this command.

```sh
bundle exec rake test
```

## Deploy instructions

Use this command to publish the website online to our server.

```sh
bundle exec rake publish
```

You can only run that command if you have authorized SSH keys on your computer.

## Author

Mary Smith and [other contributors](https://github.com/fulldecent/html-website-template/graphs/contributors) made this website with love.

## License

Copyright 2017 Mary Smith. All rights reserved.
