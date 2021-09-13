const request = require('request');
const cheerio = require('cheerio');
const fs = require('fs');

const url = 'https://storage.googleapis.com/infosimples-output/commercia/case/product.html'

finalResponse = {};

request(url, (error, response, html ) => {
  if (!error && response.statusCode == 200) {
    const $ = cheerio.load(html);

    finalResponse['title'] = $('h2#product_title').text();
    finalResponse['brand'] = $('div.brand').text();

    finalResponse['categories'] = [];
    $('nav.current-category').each((_idx, el) => {
        const category = $(el).text().replace(/\n/g,", ")
        finalResponse['categories'].push(category)
    });

    finalResponse['description'] = $('div.product-details > p').text().replace(/(\s|\&nbsp\;)+/gi, ' ');

    finalResponse['skus'] = [];
    $('#product_S0002201, #product_S0002202, #product_S0002203').each((_idx, el) => {
        const name = $(el)
            .find("div.sku-name")
            .text()
            .replace(/(\s|\&nbsp\;)+/gi, ' ')
        const current_price = $(el)
            .find("div.sku-current-price")
            .text()
        const old_price = $(el)
            .find('div.sku-old-price')
            .text()
        const available = $(el)
            .find("i")
            .text()
        finalResponse['skus'].push(  
            `{name: ${name} 
             current price: ${available === "Out of stock" ? "Not available" : current_price} 
             old price: ${old_price} 
             available: ${available === "Out of stock" ? "Not available" : "Available"}}`
        );
    })

    finalResponse['properties'] = [];
    $("table.pure-table").each((_idx, el) => {
        const propertiesLabels = [];
        if (_idx === 0) {
          const label = $(el)
            .find("b");
          $(label).each((i, el) => {
            propertiesLabels.push(
              $(el)
                .text()
            );
          });
        }
        const tds = $(el)
            .find("td:nth-child(2)");
        const propertiesValues = {};
        $(tds).each((i, el) => {
          propertiesValues[propertiesLabels[i]] = $(el).text();
        });

        finalResponse['properties'].push(propertiesValues);
      });

    // finalResponse['properties'] = [];
    // $('table.pure-table bordered').each((_idx, el) => {
    //     const label = $(el)
    //         .find('b')
    //         .text();
    //     const value = $(el)
    //         .find('td')
    //         .text();
    //     finalResponse['properties'].push(  
    //         `{${label}: ${value}}`
    //     );
    // })

    finalResponse['reviews'] = [];
    $('div.review-box').each((_idc, el) => {
        const name = $(el)
            .find('.review-username')
            .text();
        const date = $(el)
            .find('.review-date')
            .text();
        const score = $(el)
            .find('.review-score')
            .text();
        const text = $(el)
            .find('p')
            .text();
        finalResponse['reviews'].push(
            `{user: ${name}
              date: ${date}
              score: ${score}
              comment: ${text}
            }`
        );
    })

    finalResponse['average score'] = $('div#comments > h4').text();
    
    finalResponse['product URL'] = $('').text();

    const finalResponseJSON = JSON.stringify({finalResponse}, null, '\t');

    fs.writeFile('produto.json', finalResponseJSON, (err) => {
        if (err) {
            console.log(err);
        } else {
            console.log('Scraping Done!');
        }
    });
  }
});
