const request = require('request');
const cheerio = require('cheerio');
const fs = require('fs');

const url = 'https://storage.googleapis.com/infosimples-output/commercia/case/product.html'

finalResponse = {};

request(url, (error, response, html ) => {
  if (!error && response.statusCode == 200) {
    const $ = cheerio.load(html);

    // TITLE
    finalResponse['title'] = $('h2#product_title').text();

    // BRAND
    finalResponse['brand'] = $('div.brand').text();

    // CATEGORIES
    finalResponse['categories'] = [];
    $('nav.current-category > a').each((_idx, el) => {
        const category = $(el)
          .text()
          .replace(/(\s|\&nbsp\;)+/gi, ' ')
        finalResponse['categories'].push(category)
    });
    
    // DESCRIPTION
    finalResponse['description'] = $('div.product-details > p').text().replace(/(\s|\&nbsp\;)+/g, " ");

    // SKUS
    finalResponse['skus'] = [];
    $('#product_S0002201, #product_S0002202, #product_S0002203').each((_idx, el) => {
        const name = $(el)
            .find("div.sku-name")
            .text()
            .replace(/(\s|\&nbsp\;)+/g, " ")
        const current_price = $(el)
            .find("div.sku-current-price")
            .text()
            .replace(/(?!-)[^0-9.]/g, "")
        const old_price = $(el)
            .find('div.sku-old-price')
            .text()
            .replace(/(?!-)[^0-9.]/g, "")
        const available = $(el)
            .find("i")
            .text()
            .replace(/(\s|\&nbsp\;)+/g, ' ')
        finalResponse['skus'].push(  
            {"name": name,
             "current price": available === "Out of stock" ? null : parseFloat(current_price),
             "old price": old_price === "" ? null : parseFloat(old_price),
             "available": available === "Out of stock" ? false : true}
        );
    })

    // PROPERTIES
    finalResponse['properties'] = [];
    const properties = [];
    const additionalProperties = [];
    $('table.pure-table').each((_idx, el) => {
      const propertiesLabels = [];
      if (_idx === 0) {
        const label = $(el)
          .find('b');
        $(label).each((i, el) => {
          propertiesLabels.push(
            $(el)
              .text()
          );
        });
      }
      const propertiesValues = [];
      if (_idx === 0) {
        const value = $(el)
          .find('td:nth-child(2)');
        $(value).each((i, el) => {
          propertiesValues.push(
            $(el)
              .text()
          );
        });
      }
      for (var i = 0; i < propertiesLabels.length; i++){
        properties[i] = {'label': propertiesLabels[i], 'value': propertiesValues[i]};
      }
    });

    $('#additional-properties').each((_idx, el) => {
        const propertiesLabels = [];
        if (_idx === 0) {
          const label = $(el)
            .find('b');
          $(label).each((i, el) => {
            propertiesLabels.push(
              $(el)
                .text()
            );
          });
        }
        const propertiesValues = [];
        if (_idx === 0) {
          const value = $(el)
            .find('td:nth-child(2)');
          $(value).each((i, el) => {
            propertiesValues.push(
              $(el)
                .text()
            );
          });
        }
        for (var i = 0; i < propertiesLabels.length; i++){
          additionalProperties[i] = {'label': propertiesLabels[i], 'value': propertiesValues[i]};
        }
      });

      finalResponse['properties'] = [...properties, ...additionalProperties]

    // REVIEWS
    finalResponse['reviews'] = [];
    $('div.review-box').each((_idx, el) => {
        const name = $(el)
            .find('.review-username')
            .text();
        const date = $(el)
            .find('.review-date')
            .text();
        const score = $(el)
            .find('.review-stars')
            .text()
            .split('★')
        const text = $(el)
            .find('p')
            .text();
        finalResponse['reviews'].push(
            {"name": name,
             "date": date,
             "score": score.length -1,
             "comment": text
            }
        );
    })

    // AVERAGE_SCORE
    const averageScore = $('div#comments > h4').text().match(/[0-5][.][0-9]/g);
    const convertAverageScore = (parseFloat(averageScore));
    finalResponse['reviews_average_score'] = convertAverageScore;
    
    // URL
    finalResponse['url'] = url

    // JSON
    const finalResponseJSON = JSON.stringify(finalResponse, null, 2);

    fs.writeFile('produto.json', finalResponseJSON, (err) => {
        if (err) {
            console.log(err);
        } else {
            console.log('Scraping Done!');
        }
    });
  }
});
