import requests
import urlparse

from rmc.settings import paypal


def get_payment_token(amt, return_url, cancel_url, currency='USD'):
    token_generation_data = {
        'USER': paypal['USER'],
        'PWD': paypal['PWD'],
        'SIGNATURE': paypal['SIGNATURE'],
        'SUBJECT': paypal['FACILITATOR_EMAIL'],
        'METHOD': 'SetExpressCheckout',
        'VERSION': '93.0',
        'PAYMENTREQUEST_0_PAYMENTACTION': 'SALE',
        'PAYMENTREQUEST_0_AMT': amt,
        'PAYMENTREQUEST_0_CURRENCYCODE': currency,
        'RETURNURL': return_url,
        'CANCELURL': cancel_url
    }
    response = requests.post(
        'https://api-3t.paypal.com/nvp', data=token_generation_data)
    print dict(urlparse.parse_qsl(response.text))
    token = dict(urlparse.parse_qsl(response.text))['TOKEN']
    return token


def check_payment(token):
    payment_check_data = {
        'USER': paypal['USER'],
        'PWD': paypal['PWD'],
        'SIGNATURE': paypal['SIGNATURE'],
        'SUBJECT': paypal['FACILITATOR_EMAIL'],
        'METHOD': 'GetExpressCheckoutDetails',
        'VERSION': 93,
        'TOKEN': token
    }
    response = requests.post(
        'https://api-3t.paypal.com/nvp', data=payment_check_data)
    result = dict(urlparse.parse_qsl(response.text))
    payer_id = result['PAYERID']
    return payer_id
