pipeline {
    agent any

    // This block tells Jenkins to add Git and Docker to the PATH for this pipeline
    tools {
        tool 'Default', 'git'
        tool 'docker', 'docker'
    }

    environment {
        DOCKERHUB_USERNAME = "adityag3094"
        IMAGE_NAME = "${DOCKERHUB_USERNAME}/stock-tracker-app"
        IMAGE_TAG = "build-${BUILD_NUMBER}"
    }

    stages {
        stage('Build and Push Docker Image') {
            steps {
                bat 'docker -v' // 'bat' is for Windows commands
                bat "docker build -t ${IMAGE_NAME}:${IMAGE_TAG} ."
                
                withCredentials([usernamePassword(credentialsId: 'dockerhub-credentials', passwordVariable: 'DOCKER_PASSWORD', usernameVariable: 'DOCKER_USERNAME')]) {
                    bat "docker login -u ${DOCKER_USERNAME} -p ${DOCKER_PASSWORD}"
                    bat "docker push ${IMAGE_NAME}:${IMAGE_TAG}"
                    bat "docker push ${IMAGE_NAME}:latest"
                    bat "docker logout"
                }
            }
        }

        stage('Deploy to Kubernetes (Blue-Green)') {
            steps {
                script {
                    echo "Starting blue-green deployment..."
                    // Use 'bat' to execute kubectl on Windows
                    def liveColor = bat(returnStdout: true, script: "kubectl get service stock-tracker-service -o jsonpath='{.spec.selector.color}'").trim()
                    def inactiveColor = (liveColor == 'blue') ? 'green' : 'blue'
                    
                    echo "Live color is ${liveColor}. Deploying to inactive color: ${inactiveColor}."

                    bat "kubectl set image deployment/stock-tracker-${inactiveColor} stock-tracker-app=${IMAGE_NAME}:${IMAGE_TAG}"
                    bat "kubectl rollout status deployment/stock-tracker-${inactiveColor}"
                    
                    echo "Switching traffic to ${inactiveColor}..."
                    bat "kubectl patch service stock-tracker-service -p \"{\\\"spec\\\": {\\\"selector\\\": {\\\"color\\\": \\\"${inactiveColor}\\\"}}}\""
                    
                    echo "Deployment complete."
                }
            }
        }
    }
}