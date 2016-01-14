
## Visualforce / Lightning 両対応サンプル

Apex処理ではメソッドに`@AuraEnabled`と`webservice`を両方指定。

Visualforceではwebserviceとして、Lightningではアクションとして呼び出す。

画面内の処理はすべてJavaScriptで実装し、Apexの呼び出し方式以外の処理を共通化。
