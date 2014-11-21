#!/bin/bash

sudo sysctl -w kern.maxfiles=1048600
sudo sysctl -w kern.maxfilesperproc=1048576
sudo sysctl -w net.inet.ip.portrange.first=10240

ulimit -S -n 1048576
