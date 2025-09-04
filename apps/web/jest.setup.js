import '@testing-library/jest-dom'

// Define MockHeaders class first
class MockHeaders extends Map {
  get(name) {
    return super.get(name.toLowerCase());
  }
  
  set(name, value) {
    return super.set(name.toLowerCase(), value);
  }
  
  has(name) {
    return super.has(name.toLowerCase());
  }
  
  delete(name) {
    return super.delete(name.toLowerCase());
  }
}

// Mock Next.js Web API globals for API route testing
Object.assign(global, {
  Request: class MockRequest {
    constructor(url, options = {}) {
      this._url = url;
      this.method = options.method || 'GET';
      this.headers = new MockHeaders();
      this._body = options.body;
      
      if (options.headers) {
        Object.entries(options.headers).forEach(([key, value]) => {
          this.headers.set(key, value);
        });
      }
    }
    
    get url() { return this._url; }
    
    async json() {
      if (!this._body) return {};
      return JSON.parse(this._body);
    }
  },
  
  Response: class MockResponse {
    constructor(body, options = {}) {
      this._body = body;
      this.status = options.status || 200;
      this.statusText = options.statusText || 'OK';
      this.headers = new MockHeaders();
      
      if (options.headers) {
        Object.entries(options.headers).forEach(([key, value]) => {
          this.headers.set(key, value);
        });
      }
    }
    
    static json(data, options = {}) {
      const body = JSON.stringify(data);
      const response = new MockResponse(body, options);
      response.headers.set('content-type', 'application/json');
      return response;
    }
    
    async json() {
      if (this._body === undefined || this._body === null) {
        return {};
      }
      return JSON.parse(this._body);
    }
  },
  
  Headers: MockHeaders
});