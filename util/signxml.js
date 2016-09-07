var path = require('path');
var fs = require('fs');
var SignedXml = require('xml-crypto').SignedXml,
    FileKeyInfo = require('xml-crypto').FileKeyInfo,
    dom = require('xmldom').DOMParser;
var xpath = require('xpath');
var x509 = require('x509');
var Client = require('node-rest-client').Client;

module.exports = {

    parseXml : function(type,opt){

        opt = opt || [];
        type = type || "";

        var xmlFolder = path.join(__dirname, '../xml/');

        switch (type) {
            case "initTransaction":
                var _xml = fs.readFileSync(xmlFolder + 'initTransaction.xml').toString();
                break;

            case "getTransactionResult":
                var _xml = fs.readFileSync(xmlFolder + 'getTransactionResult.xml').toString();
                break;

            case "acknowledgeTransaction":
                var _xml = fs.readFileSync(xmlFolder + 'acknowledgeTransaction.xml').toString();
                break;

            default:
                return false;
                break;
        }

        for(var i=0;i<opt.length;i++){
            var o = opt[i];
            _xml = _xml.replace(o.key, o.val);
        }

        this.clearOpts();

        return _xml;
    },
    signXml : function(xml){

        var tbkFolder = path.join(__dirname, '../tbk/');
        var xmlFolder = path.join(__dirname, '../xml/');
        var _key = fs.readFileSync(tbkFolder+'server.pem');

        function MyKeyInfo() {
            this.getKeyInfo = function(key) {
                //console.log(key.toString());

                var subject = x509.parseCert( key.toString() );

                //console.log(subject)

                var _serial = Number('0x' + subject.serial).toString(10);

                var _info =
                    "C=" + subject.issuer.countryName + "," +
                    "ST=" + subject.issuer.stateOrProvinceName + "," +
                    "O=" + subject.issuer.organizationName + "," +
                    "L=" + subject.issuer.localityName + "," +
                    "CN=" + subject.issuer.commonName + "," +
                    "OU=" + subject.issuer.organizationalUnitName + "," +
                    "emailAddress=" + subject.issuer.emailAddress;

                var _xml_info = fs.readFileSync(xmlFolder+'x509data.xml').toString();
                _xml_info=_xml_info.replace("%info%",_info);
                _xml_info=_xml_info.replace("%serial%",_serial);

                return _xml_info;
            }
        }
        var sig = new SignedXml("wssecurity");

        sig.keyInfoProvider = new MyKeyInfo();
        sig.keyInfoProvider.getKeyInfo(_key);
        sig.addReference("//*[local-name(.)='Body']");
        sig.signingKey = _key;
        sig.computeSignature(xml,{
            prefix : "ds",
            location: { reference: "//*[local-name(.)='Security']", action: "append" } //This will place the signature after the book element
        });

        return sig.getSignedXml();
    },
    _tempArr : [],
    setOpts : function(key,val){
        var _t = {
            key : key,
            val : val
        };
        this._tempArr.push(_t);
    },
    getOpts : function(){
        return this._tempArr;
    },
    clearOpts : function(){
        this._tempArr = [];
    },
    checkXml : function(xml){

        console.log("checkXml");
        console.log(xml)

        var tbkFolder = path.join(__dirname, '../tbk/');
        var sselect = xpath.useNamespaces(
            {
                "soap": "http://schemas.xmlsoap.org/soap/envelope/",
                "ns2": "http://service.wswebpay.webpay.transbank.com/",
                "ds": "http://www.w3.org/2000/09/xmldsig#",
                "wsse" : "http://docs.oasis-open.org/wss/2004/01/oasis-200401-wss-wssecurity-secext-1.0.xsd",
                "wsu" : "http://docs.oasis-open.org/wss/2004/01/oasis-200401-wss-wssecurity-utility-1.0.xsd",
                "ec" : "http://www.w3.org/2001/10/xml-exc-c14n#"
            }
        );
        var doc = new dom().parseFromString(xml);
        var signature = sselect("//soap:Header//wsse:Security//ds:Signature", doc)[0]

        if(typeof signature === "undefined"){
            return false;
        }

        var sig = new SignedXml()
        sig.keyInfoProvider = new FileKeyInfo(tbkFolder+"tbk.pem")
        sig.loadSignature(signature.toString())
        var res = sig.validateReferences(doc)

        return res;

    }

}
