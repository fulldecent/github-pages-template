# Multi-threading HTML Validation

This repository now supports parallel processing for HTML validation using worker threads!

## Features

### 🔧 New Scripts
- `yarn setup-multithread-test` - Creates 100 test files for testing multi-threading
- `yarn test-multithread` - Runs dedicated parallel processing test
- `yarn test-parallel` - Runs regular tests with parallel processing enabled

### ⚡ Performance Modes

#### Sequential Mode (default)
```bash
yarn node test/build-html-validate.mjs
```

#### Parallel Mode
```bash
yarn node test/build-html-validate.mjs --parallel
# or
HTML_VALIDATE_PARALLEL=true yarn node test/build-html-validate.mjs
```

### 🎛️ Configuration

Environment variables:
- `HTML_VALIDATE_PARALLEL=true` - Enable parallel processing
- `HTML_VALIDATE_WORKERS=4` - Number of worker threads (default: 4)

### 📊 Progress Visualization

- **Sequential mode**: Single progress bar with file processing status
- **Parallel mode**: Multiple progress bars showing each worker's progress plus overall progress

### 🚀 Performance Benefits

Multi-threading provides performance benefits for:
- Large numbers of HTML files
- Complex validation rules that are CPU-intensive
- I/O-bound operations like external link checking

## Demo

To see the multi-threading in action:

1. Setup test data:
   ```bash
   yarn setup-multithread-test
   ```

2. Compare performance:
   ```bash
   # Sequential processing
   time yarn node test/build-html-validate.mjs
   
   # Parallel processing  
   time yarn node test/build-html-validate.mjs --parallel
   ```

3. See dedicated multi-threading test:
   ```bash
   yarn test-multithread
   ```

## Implementation Details

- **Worker Script**: `test/html-validate-worker.mjs` - Processes individual files
- **Main Script**: Enhanced `test/build-html-validate.mjs` with parallel support
- **Progress Bars**: Uses `cli-progress` MultiBar for visual feedback
- **Error Handling**: Proper error propagation from workers to main thread
- **Backward Compatibility**: Seamlessly falls back to sequential mode when needed