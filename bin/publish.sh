#!/bin/sh
set -eu

rm -f dist/*
npx parcel build --public-url /url-timer/ index.html
rm -f docs/*
cp dist/* docs/
cd docs/
ln -s index.html 404.html
