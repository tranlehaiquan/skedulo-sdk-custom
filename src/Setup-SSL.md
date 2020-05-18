# Packages SSL Setup

## Windows setup

 1. Install [OpenSSL](https://wiki.openssl.org/index.php/Binaries).
 2. Create a folder in your user account \(eg. C:\Users\lisat\\)  called .localhost-ssl.
 3. Create a file called server.csr.cnf and paste the following into it:

 ```bash
  [req]
  default_bits = 2048
  prompt = no
  default_md = sha256
  distinguished_name = dn

  [dn]
  C=AU
  ST=QLD
  L=Brisbane
  O=Skedulo
  OU=Dev
  emailAddress=your@email.com
  CN = localhost
```

 4. Create a file called v3.ext and paste the following into it:
 ```bash
  authorityKeyIdentifier=keyid,issuer
  basicConstraints=CA:FALSE
  keyUsage = digitalSignature, nonRepudiation, keyEncipherment, dataEncipherment
  subjectAltName = @alt_names

  [alt_names]
  DNS.1 = localhost
```

 5. Open a Command Prompt, navigate to the newly created folder and run the following to create the Root CA private key:

 ```bash
 openssl genrsa -des3 -out rootCA.key 2048
 ```

 6. Run the following to create a Root CA Certificate signed with the private key. Answer the questions with whatever you like:
 ```bash
 openssl req -x509 -new -nodes -key rootCA.key -sha256 -days 1024 -out rootCA.pem
 ```

 7. We'll now use the Root CA to create a self-signed certificate using localhost as the SAN \(Subject Alternative Name\) and CN \(Common Name\). Run the following commands (make sure to keep the file names as is):
 ```bash
 openssl req -new -sha256 -nodes -out server.csr -newkey rsa:2048 -keyout server.key -config server.csr.cnf
 ```
 ```bash
 openssl x509 -req -in server.csr -CA rootCA.pem -CAkey rootCA.key -CAcreateserial -out server.crt -days 500 -sha256 -extfile v3.ext
 ```

 8. Add the rootCA.pem found in the .localhost-ssl folder to Chrome by going to Settings > Manage Certificates > Select the Trusted Root Certification Authorities tab and click Import. You will be asked if you want to use this certificate as a trusted Authority. Click Yes.
