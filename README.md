#the-printlab webapp
**Configuraciones**

process.env.NODE_ENV

    app.js linea 29
    Dependiendo del NODE_ENV la app queda configurada para el ambiente correspondiente. Los posibles casos:

    //production
    "codigoComercio" : "597032243762",
    "urlSoap" : "https://webpay3g.transbank.cl/WSWebpayTransaction/cxf/WSWebpayService?wsdl"

    //default
    "codigoComercio" : "597020000541",
    "urlSoap" : "https://webpay3gint.transbank.cl/WSWebpayTransaction/cxf/WSWebpayService?wsdl"

----------

    util/signxml.js linea 9
    Dependiendo del NODE_ENV cargará los certificados de transbank

    //production
    tbk/production_server.pem
    tbk/production_tbk.pem

    //default
    tbk/development_server.pem
    tbk/development_tbk.pem

----------

process.env.URL_BASE

    Parametro utilizado para indicar la URL de la webapp a la cual se le concatenará las url enviadas a TBK (return y final).


----------

process.env.API_URL : URL API Printlab.

process.env.API_USER : USER API Printlab.

process.env.API_PASSWORD : PASSWORD USER API Printlab.

process.env.MONGODB_URI : MongoDB URI