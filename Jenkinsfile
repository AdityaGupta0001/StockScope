pipeline {
    // 1. Specify where to run the pipeline. 'any' means any available Jenkins agent.
    agent any

    // 2. Define environment variables used throughout the pipeline.
    environment {
        // IMPORTANT: Change this to your Docker Hub username
        DOCKERHUB_USERNAME = "adityag3094"
        IMAGE_NAME = "${DOCKERHUB_USERNAME}/stock-tracker-app"
        // Use Jenkins' build number to create a unique tag for each build
        IMAGE_TAG = "latest"
    }

    // 3. Define the stages of the pipeline.
    stages {
        
        // STAGE 1: Checkout Code
        // Pulls the latest code from your GitHub repository.
        stage('Checkout') {
            steps {
                git branch: 'main', url: 'https://github.com/AdityaGupta0001/StockScope.git'
            }
        }

        // STAGE 2: Build Docker Image
        // Uses the Dockerfile in your repository to build a new image.
        stage('Build Docker Image') {
            steps {
                script {
                    echo "Building Docker image ${IMAGE_NAME}:${IMAGE_TAG}..."
                    // The '.' refers to the current directory (your workspace)
                    docker.build("${IMAGE_NAME}:${IMAGE_TAG}", '.')
                }
            }
        }
        
        // STAGE 3: Push Docker Image
        // Logs into Docker Hub and pushes the newly built image to your repository.
        stage('Push Docker Image') {
            steps {
                script {
                    echo "Pushing Docker image to Docker Hub..."
                    // Uses the 'dockerhub-credentials' ID we created in Jenkins
                    // Jenkins will securely handle the login and logout
                    docker.withRegistry('https://registry.hub.docker.com', 'dockerhub-credentials') {
                        docker.image("${IMAGE_NAME}:${IMAGE_TAG}").push()
                    }
                }
            }
        }
    }
    
    // 4. Post-build actions
    // This block runs after all stages are complete, regardless of success or failure.
    post {
        always {
            echo 'Pipeline finished.'
            // Clean up local Docker images to save space
            script {
                sh "docker rmi ${IMAGE_NAME}:${IMAGE_TAG}"
            }
        }
    }
}