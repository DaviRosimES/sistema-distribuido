from enum import StrEnum


# Moedas em que dá pra simular. O cálculo é o mesmo nas duas (ver services/calculadora.py);
# a moeda decide de onde vem a cotação e como os valores são exibidos.
class Moeda(StrEnum):
    BRL = "BRL"
    USD = "USD"
