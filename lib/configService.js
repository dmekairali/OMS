class ConfigService {
  constructor() {
    this.configuration = null;
    this.stageConfig = null;
    this.loading = false;
    this.loadPromise = null;
  }

  async loadConfiguration(forceRefresh = false) {
    // Return cached config if available
    if (!forceRefresh && this.configuration && this.stageConfig) {
      return { configuration: this.configuration, stageConfig: this.stageConfig };
    }

    // If already loading, wait for that promise
    if (this.loading && this.loadPromise) {
      return this.loadPromise;
    }

    this.loading = true;
    this.loadPromise = this._fetchConfiguration();

    try {
      const result = await this.loadPromise;
      return result;
    } finally {
      this.loading = false;
      this.loadPromise = null;
    }
  }

  async _fetchConfiguration() {
    try {
      const response = await fetch('/api/configuration');
      
      if (!response.ok) {
        throw new Error('Failed to load configuration');
      }

      const data = await response.json();
      this.configuration = data.configuration;
      this.stageConfig = data.stageConfig;
      
      console.log('Configuration loaded successfully');
      
      return { configuration: this.configuration, stageConfig: this.stageConfig };
    } catch (error) {
      console.error('Error loading configuration:', error);
      throw error;
    }
  }

  getFieldsForSheet(sheetName) {
    if (!this.configuration || !this.configuration[sheetName]) {
      return [];
    }
    return this.configuration[sheetName].fields;
  }

  getDisplayFieldsForStage(stage) {
    if (!this.stageConfig || !this.stageConfig[stage]) {
      return [];
    }
    return this.stageConfig[stage].filter(f => f.displayInList);
  }

  getEditableFieldsForStatus(sheetName, status) {
    const fields = this.getFieldsForSheet(sheetName);
    return fields.filter(f => {
      if (!f.editable) return false;
      if (f.showWhenStatus === 'all') return true;
      return f.showWhenStatus === status;
    });
  }

  getStageForSheet(sheetName) {
    if (!this.configuration || !this.configuration[sheetName]) {
      return 'New Orders';
    }
    return this.configuration[sheetName].stage;
  }

  clearCache() {
    this.configuration = null;
    this.stageConfig = null;
  }

  isLoaded() {
    return this.configuration !== null && this.stageConfig !== null;
  }
}

const configService = new ConfigService();
export default configService;
