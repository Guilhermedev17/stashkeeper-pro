/**
 * Configuração do Jest para os testes de API e performance do StashKeeper
 */

export default {
  // Diretório raiz para busca dos testes
  rootDir: './',
  
  // Ambiente de teste - Node para APIs
  testEnvironment: 'node',
  
  // Padrões de arquivos que serão considerados testes
  testMatch: [
    '**/test_scripts/api_tests/**/*_test.js',
    '**/test_scripts/api_tests/**/*_performance_test.js'
  ],
  
  // Ignore node_modules
  testPathIgnorePatterns: ['/node_modules/'],
  
  // Timeout para testes
  testTimeout: 30000, // 30 segundos para testes normais
  
  // Configuração de cobertura de código
  collectCoverage: false,
  coverageDirectory: './test_scripts/coverage',
  coveragePathIgnorePatterns: ['/node_modules/', '/test_scripts/'],
  
  // Exibição de informações durante os testes
  verbose: true,
  
  // Transformações necessárias
  transform: {},
  
  // Executar setupFiles antes dos testes
  setupFiles: ['./test_scripts/jest.setup.js'],
  
  // Reporters personalizados
  reporters: ['default'],
  
  // Configurações específicas para testes de performance
  globals: {
    '__PERFORMANCE_TEST__': true
  }
}; 