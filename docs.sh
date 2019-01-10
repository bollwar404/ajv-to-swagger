echo 'generating base readme'
jsdoc2md --plugin dmd-bitbucket --template descr.hbs --files index.js > README.md

echo 'generating coverage report'
nyc report --reporter=text > coverage.md
sed -i '$ d' coverage.md
tail -n +2 coverage.md > coverage.md.tmp && mv coverage.md.tmp coverage.md

echo 'assembling'
cat coverage.md >> README.md
rm coverage.md
echo 'ok'
