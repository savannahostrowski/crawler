import httplib2
from bs4 import BeautifulSoup, SoupStrainer

def getLinks(webpage):
	links = []
	http = httplib2.Http()
	status, response = http.request(webpage)
	for link in BeautifulSoup(response, parse_only=SoupStrainer('a')):
	    if link.has_attr('href'):
	        links.append(link['href'])
	print(links)

getLinks('http://www.ostrowski.ca')