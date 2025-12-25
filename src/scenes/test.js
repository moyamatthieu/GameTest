import { EventBus } from './EventBus.js';
import { EntityFactory } from './EntityFactory.js';
import { SceneDirector } from './SceneDirector.js';
import { PlanetScene } from './PlanetScene.js';
import { SystemScene } from './SystemScene.js';
import { GalaxyScene } from './GalaxyScene.js';

/**
 * Test suite for the new scene architecture
 */
export class SceneArchitectureTest {
  constructor() {
    this.eventBus = null;
    this.entityFactory = null;
    this.director = null;
    this.results = {
      passed: 0,
      failed: 0,
      tests: []
    };
  }

  /**
   * Run all tests
   */
  async runAllTests() {
    console.log('=== Starting Scene Architecture Tests ===\n');

    await this.testEventBus();
    await this.testEntityFactory();
    await this.testSceneDirector();
    await this.testSceneIntegration();

    this.printResults();
  }

  /**
   * Test EventBus functionality
   */
  async testEventBus() {
    console.log('--- Testing EventBus ---');

    this.eventBus = new EventBus();
    let testValue = 0;

    // Test 1: Basic event emission and listening
    this.eventBus.on('test:increment', (data) => {
      testValue += data.amount;
    });

    this.eventBus.emit('test:increment', { amount: 5 });
    this.assert(testValue === 5, 'EventBus: Basic event listening', 'Should increment value to 5');

    // Test 2: Multiple listeners
    let secondValue = 0;
    this.eventBus.on('test:increment', (data) => {
      secondValue += data.amount * 2;
    });

    this.eventBus.emit('test:increment', { amount: 3 });
    this.assert(testValue === 8 && secondValue === 6, 'EventBus: Multiple listeners', 'Both listeners should be called');

    // Test 3: Once listener
    let onceValue = 0;
    this.eventBus.once('test:once', (data) => {
      onceValue = data.value;
    });

    this.eventBus.emit('test:once', { value: 10 });
    this.assert(onceValue === 10, 'EventBus: Once listener (first call)', 'Once listener should be called');

    onceValue = 0;
    this.eventBus.emit('test:once', { value: 20 });
    this.assert(onceValue === 0, 'EventBus: Once listener (second call)', 'Once listener should not be called again');

    // Test 4: Unsubscribe
    const unsubscribe = this.eventBus.on('test:unsub', (data) => {
      testValue = data.value;
    });

    this.eventBus.emit('test:unsub', { value: 100 });
    unsubscribe();
    this.eventBus.emit('test:unsub', { value: 200 });
    this.assert(testValue === 100, 'EventBus: Unsubscribe', 'Listener should be unsubscribed');

    // Test 5: Global listeners
    let globalEvent = null;
    let globalData = null;
    this.eventBus.onAll((eventName, data) => {
      globalEvent = eventName;
      globalData = data;
    });

    this.eventBus.emit('test:global', { test: true });
    this.assert(globalEvent === 'test:global' && globalData.test, 'EventBus: Global listeners', 'Global listener should receive all events');

    console.log('');
  }

  /**
   * Test EntityFactory functionality
   */
  async testEntityFactory() {
    console.log('--- Testing EntityFactory ---');

    // Mock assetManager and world
    const mockAssetManager = {
      getGeometry: (name, factory) => factory(),
      getMaterial: (name, factory) => factory(),
      getFromPool: (name, factory) => factory()
    };

    const mockWorld = {
      createEntity: () => Math.floor(Math.random() * 1000),
      addComponent: () => {},
      getComponent: () => null
    };

    this.entityFactory = new EntityFactory(mockAssetManager, mockWorld);

    // Test 1: Templates are created
    this.assert(
      this.entityFactory.templates.buildings !== undefined &&
      this.entityFactory.templates.ships !== undefined &&
      this.entityFactory.templates.planets !== undefined,
      'EntityFactory: Templates creation',
      'All template categories should be created'
    );

    // Test 2: Building template exists
    this.assert(
      this.entityFactory.templates.buildings.base !== undefined,
      'EntityFactory: Building templates',
      'Base building template should exist'
    );

    // Test 3: Ship template exists
    this.assert(
      this.entityFactory.templates.ships.player !== undefined,
      'EntityFactory: Ship templates',
      'Player ship template should exist'
    );

    // Test 4: Planet template exists
    this.assert(
      this.entityFactory.templates.planets.terrestre !== undefined,
      'EntityFactory: Planet templates',
      'Terrestrial planet template should exist'
    );

    // Test 5: Create laser effect
    const laser = this.entityFactory.createLaser(
      { x: 0, y: 0, z: 0 },
      { x: 10, y: 0, z: 0 },
      { color: 0xff0000 }
    );
    this.assert(laser !== null && laser.isLine, 'EntityFactory: Laser creation', 'Should create a laser line');

    // Test 6: Create planet grid
    const grid = this.entityFactory.createPlanetGrid(100, {
      color: 0x444444,
      opacity: 0.3
    });
    this.assert(grid !== null && grid.isGroup, 'EntityFactory: Planet grid creation', 'Should create a planet grid group');

    console.log('');
  }

  /**
   * Test SceneDirector functionality
   */
  async testSceneDirector() {
    console.log('--- Testing SceneDirector ---');

    // Mock game object
    const mockGame = {
      assetManager: {
        getGeometry: (name, factory) => factory(),
        getMaterial: (name, factory) => factory(),
        getFromPool: (name, factory) => factory()
      },
      world: {
        createEntity: () => Math.floor(Math.random() * 1000),
        addComponent: () => {},
        getComponent: () => null,
        destroyEntity: () => {},
        getEntitiesWith: () => []
      },
      renderer: {
        domElement: document.createElement('canvas')
      },
      networkManager: null,
      constants: {
        NAV_IDS: {
          PLANET: 'nav-planet',
          SYSTEM: 'nav-system',
          GALAXY: 'nav-galaxy'
        }
      }
    };

    this.director = new SceneDirector(mockGame);

    // Test 1: Director is initialized
    this.assert(
      this.director !== null &&
      this.director.eventBus !== null &&
      this.director.entityFactory !== null,
      'SceneDirector: Initialization',
      'Director should be initialized with EventBus and EntityFactory'
    );

    // Test 2: Scene registration
    const mockScene = {
      name: 'test',
      scene: { clear: () => {} },
      camera: { aspect: 1, updateProjectionMatrix: () => {} },
      init: () => {},
      update: () => {},
      render: () => {}
    };

    this.director.registerScene('test', mockScene);
    this.assert(this.director.hasScene('test'), 'SceneDirector: Scene registration', 'Scene should be registered');

    // Test 3: EventBus access
    const eventBus = this.director.getEventBus();
    this.assert(eventBus !== null, 'SceneDirector: EventBus access', 'Should provide EventBus instance');

    // Test 4: EntityFactory access
    const entityFactory = this.director.getEntityFactory();
    this.assert(entityFactory !== null, 'SceneDirector: EntityFactory access', 'Should provide EntityFactory instance');

    // Test 5: Entity creation
    const entity = this.director.createEntity('ship', {
      name: 'Test Ship',
      position: { x: 0, y: 0, z: 0 },
      faction: 'player'
    });
    this.assert(entity !== null, 'SceneDirector: Entity creation', 'Should create entity via director');

    console.log('');
  }

  /**
   * Test scene integration
   */
  async testSceneIntegration() {
    console.log('--- Testing Scene Integration ---');

    // Mock game object with more complete mock
    const mockGame = {
      assetManager: {
        getGeometry: (name, factory) => factory(),
        getMaterial: (name, factory) => factory(),
        getFromPool: (name, factory) => factory()
      },
      world: {
        createEntity: () => Math.floor(Math.random() * 1000),
        addComponent: () => {},
        getComponent: () => null,
        destroyEntity: () => {},
        getEntitiesWith: () => []
      },
      renderer: {
        domElement: document.createElement('canvas')
      },
      networkManager: null,
      constants: {
        SCENES: {
          PLANET: 'planet',
          SYSTEM: 'system',
          GALAXY: 'galaxy'
        },
        NAV_IDS: {
          PLANET: 'nav-planet',
          SYSTEM: 'nav-system',
          GALAXY: 'nav-galaxy'
        }
      },
      playerEntity: 1,
      playerCorp: 'player_corp',
      rivalCorp: 'rival_corp'
    };

    const director = new SceneDirector(mockGame);

    // Test 1: Create scenes
    const planetScene = new PlanetScene(mockGame);
    const systemScene = new SystemScene(mockGame);
    const galaxyScene = new GalaxyScene(mockGame);

    this.assert(
      planetScene !== null && systemScene !== null && galaxyScene !== null,
      'Scene Integration: Scene creation',
      'All scenes should be created successfully'
    );

    // Test 2: Register scenes with director
    director.registerScene('planet', planetScene);
    director.registerScene('system', systemScene);
    director.registerScene('galaxy', galaxyScene);

    this.assert(
      director.hasScene('planet') && director.hasScene('system') && director.hasScene('galaxy'),
      'Scene Integration: Scene registration',
      'All scenes should be registered with director'
    );

    // Test 3: Verify scene properties
    this.assert(
      planetScene.director === director &&
      planetScene.eventBus !== null &&
      planetScene.entityFactory !== null,
      'Scene Integration: Scene properties',
      'Scenes should have director, eventBus, and entityFactory references'
    );

    console.log('');
  }

  /**
   * Assertion helper
   */
  assert(condition, testName, description) {
    const result = condition ? 'PASS' : 'FAIL';
    const message = `[${result}] ${testName}: ${description}`;

    if (condition) {
      this.results.passed++;
      console.log(message);
    } else {
      this.results.failed++;
      console.error(message);
    }

    this.results.tests.push({
      name: testName,
      description,
      result: result,
      condition
    });
  }

  /**
   * Print test results
   */
  printResults() {
    console.log('\n=== Test Results ===');
    console.log(`Passed: ${this.results.passed}`);
    console.log(`Failed: ${this.results.failed}`);
    console.log(`Total: ${this.results.tests.length}`);
    console.log(`Success Rate: ${((this.results.passed / this.results.tests.length) * 100).toFixed(2)}%`);

    if (this.results.failed > 0) {
      console.log('\nFailed Tests:');
      this.results.tests
        .filter(test => !test.condition)
        .forEach(test => {
          console.error(`  - ${test.name}: ${test.description}`);
        });
    }

    console.log('\n=== Scene Architecture Tests Complete ===');
  }
}

// Auto-run tests if this file is executed directly
if (typeof window !== 'undefined' && window.document) {
  // Run tests when DOM is ready
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', () => {
      const testSuite = new SceneArchitectureTest();
      testSuite.runAllTests();
    });
  } else {
    const testSuite = new SceneArchitectureTest();
    testSuite.runAllTests();
  }
}
