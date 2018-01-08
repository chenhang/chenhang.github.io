#!/bin/sh

# Login as root
sudo su

# Install python 2 and 3 
# and other libraries
apt-get update
apt-get install python3.6
apt install python3-pip
# pip3 install -r requirements.txt
# pip install -r requirements.txt

# Install ruby
gpg --keyserver hkp://keys.gnupg.net --recv-keys 409B6B1796C275462A1703113804BB82D39DC0E3
curl -sSL https://get.rvm.io | bash -s stable # After this follow the instruction
rvm install ruby
