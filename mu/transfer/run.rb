require 'json'
require 'csv'
require 'open-uri'
require 'active_support/all'
require 'nokogiri'
require 'twitter'

client = Twitter::REST::Client.new do |config|
  config.consumer_key = "Yr7tMyOlCpmyqSo4BzLTxXeRp"
  config.consumer_secret = "tOPdl34MqlU2Et6eIzHkWonCLkiXER89Smbni5XfJMcry0R4WU"
  config.access_token = "1471919138-110nmqmQvMS0aa22OGj7JBymidk3SEm0g5fbduV"
  config.access_token_secret = "h9hkxslnA8DQ5ZfAtMzPuvh1yB871eJVuUYloukqrZR4j"
end

URL_BASE = "http://www.redcafe.net/"

def get(page=1)
  open("http://www.redcafe.net/threads/transfer-tweets-summer-2017-this-is-not-the-perisic-v-salah-thread.429443/page-#{page}").read
end

def get_transfer_tweets(client)
  transfer_data = JSON.parse(File.read('transfer.json'))
  data = transfer_data['tweets'] || {}
  old_pages = transfer_data['pages'] || []
  seen_posts = transfer_data['seen_posts'] || []
  h = Nokogiri::HTML(get(1))
  last_page = h.css('.PageNav').css('a').reject { |t| t.text.include?('Next') }.last.text.to_i
  pages = (1..last_page).to_a - old_pages
  pages.each do |page|
    puts(page)
    h = Nokogiri::HTML(get(page))
    posts = h.css('li.message')
    posts.each do |post|
      body = post.css('blockquote')
      link = URL_BASE + post.css('.hashPermalink').attribute('href').text
      next if seen_posts.include?(link)
      puts(link)
      main_text = body.css('.messageText').css(' > text()').text
      # quote_text = body.css('.quote')[0].css(' > text()').text
      tweet_urls = post.children.css('.twitter-tweet').children.css('a').map { |t| t.attribute('href').text }
      tweet_urls.each do |url|
        begin
          puts(url)
          tweet = client.status(url)
          tweet_data = (data[tweet.id] || {}).merge(tweet.attrs)
          tweet_data['comments'] = (tweet_data['comments'] || []).append(main_text).uniq
          tweet_data['floor'] ||= post.css('.hashPermalink').text.gsub('#', '')
          tweet_data['link'] ||= link
          tweet_data['in_reply_to'] ||= client.status(tweet.in_reply_to_status_id).attrs rescue nil
          data[tweet.id] = tweet_data
        rescue Twitter::Error::NotFound => e
          next
        end
      end
      seen_posts.append(link)

    end

    old_pages.append(page) if posts.size >= 40
    # Save when every page end
    transfer_data['tweets'] = data
    transfer_data['seen_posts'] = seen_posts
    transfer_data['pages'] = old_pages
    File.open('transfer.json', 'w') do |f|
      f.write(transfer_data.to_json)
    end
  end

end

get_transfer_tweets(client)