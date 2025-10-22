pipeline {
    agent any

    environment {
        DOCKERHUB_USERNAME = "adityag3094" // I've used the username from your logs
        IMAGE_NAME = "${DOCKERHUB_USERNAME}/stock-tracker-app"
        IMAGE_TAG = "build-${BUILD_NUMBER}" // Use a unique tag for each build
    }

    stages {
        // The 'Checkout' stage has been REMOVED.
        // Jenkins automatically checks out the code before this point.

        stage('Build Docker Image') {
            steps {
                script {
                    echo "Building Docker image ${IMAGE_NAME}:${IMAGE_TAG}..."
                    docker.build("${IMAGE_NAME}:${IMAGE_TAG}", '.')
                }
            }
        }
        
        stage('Push Docker Image') {
            steps {
                script {
                    echo "Pushing Docker image to Docker Hub..."
                    docker.withRegistry('https://registry.hub.docker.com', 'dockerhub-credentials') {
                        docker.image("${IMAGE_NAME}:${IMAGE_TAG}").push()
                        
                        // Also push a 'latest' tag
                        docker.image("${IMAGE_NAME}:${IMAGE_TAG}").push('latest')
                    }
                }
            }
        }
    }
    
    post {
        always {
            echo 'Pipeline finished.'
        }
        success {
            echo 'Cleaning up local Docker images...'
            // This will only run on success to prevent errors
            script {
                sh "docker rmi ${IMAGE_NAME}:${IMAGE_TAG}"
            }
        }
    }
}