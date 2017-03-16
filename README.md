# HTML Website Template
Use this template as a starting point for any HTML website project that you want other people to collaborate on.

**STATUS: This project is in the planning phase.**

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

 - [ ] Open the `source/` folder in your favorite text editor and make a great web page.
 - [ ] Fix all validation testing errors, add more tests (yes really)
 - [ ] Upload your website source code to GitHub or other collaboration point
 - [ ] Enable Travis CI validation testing for your repository
 - [ ] Add a screenshot or AT LEAST some picture, and fill in this readme
 - [ ] Update the release script in `Rakefile`
 - [ ] Delete all this crap up here
 - [ ] Publish the site (full steps are in [CONTRIBUTING.md](CONTRIBUTING.md) in case you forget)
 - [ ] Set up HTTPS on your website (e.g. using Let's Encrypt)

THEN YOU'RE DONE, GO STAR [html-website-template](https://github.com/fulldecent/html-website-template) FOR UPDATES.

---

# My First Website About Horses

[![CI Status](http://img.shields.io/travis/fulldecent/html-website-template.svg?style=flat)](https://travis-ci.org/fulldecent/html-website-template)

This website is published at https://example.com/horses/

<a href="https://placehold.it/400?text=Screen+shot"><img width=200 height=200 src="https://placehold.it/400?text=Screen+shot" alt="Screenshot" /></a>

## Mission

This website exists to help educate the world about horses. There are so many kinds of horses and they are all just so magical. After you read these pages you will definitely want to get one for yourself!

## Build instructions

No building is necessary, just access the `source/` folder using a web browser. Also, you may use `php -S localhost:8000` or equivalent to serve your local copy of the website using a computer, then access it using a phone or other device.

Our validation testing automatically checks for problems on the website before we publish it. Run our test suite by doing the following:

 1. Use the command line and install `ruby` on your computer (installed by default on macOS and all Linux versions)
 2. `gem install bundler`
 3. `bundle install`
 4. `bundle exec rake test`

## Deploy instructions

 1. `bundle exec rake deploy`

## Author

Mary Smith and [other contributors](https://github.com/fulldecent/html-website-template/graphs/contributors) made this website with love.

## License

This website is published under the MIT license. See the LICENSE file for more info.
