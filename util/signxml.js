var path = require('path');
var fs = require('fs');
var SignedXml = require('xml-crypto').SignedXml,
    FileKeyInfo = require('xml-crypto').FileKeyInfo,
    select = require('xml-crypto').xpath,
    dom = require('xmldom').DOMParser;
var x509 = require('x509');

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

        var doc = new dom().parseFromString(xml)
        var signature 	= select(doc, "//*[local-name(.)='Signature' and namespace-uri(.)='http://www.w3.org/2000/09/xmldsig#']")[0];
        var sig = new SignedXml();
        var tbkFolder = path.join(__dirname, '../tbk/');

        // Hack to fix TBK's non standar signature
        // We are rewriting the method from the xml-crypto lib
        // xml-crypto/lib/signed-xml.js line 272
        sig.__proto__.validateSignatureValue = function() {
            var signedInfo = select(doc, "//*[local-name(.)='SignedInfo']");
            if (signedInfo.length==0) throw new Error("could not find SignedInfo element in the message");
            var signedInfoCanon = this.getCanonXml([this.canonicalizationAlgorithm], signedInfo[0]);
            // ---- BEGIN HACK ----
            signedInfoCanon = signedInfoCanon.toString().replace("xmlns:ds=\"http://www.w3.org/2000/09/xmldsig#\"", "xmlns:ds=\"http://www.w3.org/2000/09/xmldsig#\" xmlns:soap=\"http://schemas.xmlsoap.org/soap/envelope/\"");
            // ---- END HACK -----
            var signer = this.findSignatureAlgorithm(this.signatureAlgorithm);
            var res = signer.verifySignature(signedInfoCanon, this.signingKey, this.signatureValue);
            if (!res) this.validationErrors.push("invalid signature: the signature value " + this.signatureValue + " is incorrect");
            return res
        };

        sig.keyInfoProvider = new FileKeyInfo(tbkFolder+"tbk.pem");
        sig.loadSignature(signature);
        var res = sig.checkSignature(xml);
        if (!res) console.log(sig.validationErrors);
        return res;

    }

}
