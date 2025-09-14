#!/bin/sh
printf '[build]\ncommand = ""\npublish = "dist"\n' > netlify.toml
git add netlify.toml
git commit -m "Netlify: deploy static, skip npm build"
git push