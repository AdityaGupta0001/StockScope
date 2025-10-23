pipeline {
    agent any

    tools {
        git 'Default'
        dockerTool 'docker'
    }

    environment {
        KUBECONFIG = "C:\\Users\\Dell\\.kube\\config"
        DOCKERHUB_USERNAME = "adityag3094"
        IMAGE_NAME = "${DOCKERHUB_USERNAME}/stock-tracker-app"
        IMAGE_TAG = "build-${BUILD_NUMBER}"
    }

    stages {
        // NEW: This stage checks if docker and kubectl are working
        stage('Verify Tools') {
            steps {
                echo "Verifying tool access..."
                bat 'docker -v'
                bat 'kubectl version --client'
                bat 'kubectl cluster-info'
            }
        }

        stage('Build and Push Docker Image') {
            steps {
                bat "docker build -t ${IMAGE_NAME}:${IMAGE_TAG} ."
                
                withCredentials([usernamePassword(credentialsId: 'dockerhub-credentials', passwordVariable: 'DOCKER_PASSWORD', usernameVariable: 'DOCKER_USERNAME')]) {
                    bat "docker login -u ${DOCKER_USERNAME} -p ${DOCKER_PASSWORD}"
                    bat "docker tag ${IMAGE_NAME}:${IMAGE_TAG} ${IMAGE_NAME}:latest"
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
                    def liveColor = bat(returnStdout: true, script: "kubectl get service stock-tracker-service -o jsonpath='{.spec.selector.color}'").trim()
                    def inactiveColor = (liveColor == 'blue') ? 'green' : 'blue'
                    
                    echo "Live color is ${liveColor}. Deploying to inactive color: ${inactiveColor}."

                    bat "kubectl set image deployment/stock-tracker-${inactiveColor} stock-tracker-app=${IMAGE_NAME}:${IMAGE_TAG}"
                    bat "kubectl rollout status deployment/stock-tracker-${inactiveColor}"
                    
                    echo "Switching traffic to ${inactiveColor}..."
                    bat "kubectl set selector service/stock-tracker-service color=${inactiveColor} --overwrite"
                    
                    echo "Deployment complete."
                }
            }
        }
    }
}