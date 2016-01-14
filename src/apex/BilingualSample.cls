global class BilingualSample {
	@AuraEnabled
	static webservice Account[] getAccounts() {
		return [select Id, Name from Account limit 10];
	}
}