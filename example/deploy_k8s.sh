docker build -t example-api:latest .
helm upgrade -n example-api --create-namespace --install example-api ./helm --force