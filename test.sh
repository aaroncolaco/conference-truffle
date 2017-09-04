#!/bin/bash
# run testrpc and run tests

testrpc &
truffle test
killall node

