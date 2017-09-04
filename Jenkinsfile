pipeline {
    stages {
      stage('install npm modules') {
        steps {
            sh 'npm install -g ethereumjs-testrpc truffle '
          }
        }

        stage('truffle compile') {
          steps {
            sh 'truffle compile'
          }
        }

        stage('truffle test') {
            steps {
              timeout(time: 5, unit: 'MINUTES') {
                sh 'bash test.sh'
              }
            }
        }
    }

    post {
        always {
            echo 'One way or another, I have finished'
            deleteDir() /* clean up our workspace */
        }
        success {
            echo 'I succeeeded!'
            slackSend channel: '#ops-room',
                  color: 'good',
                  message: "The pipeline ${currentBuild.fullDisplayName} completed successfully."
        }
        unstable {
            echo 'I am unstable :/'
        }
        failure {
            slackSend channel: '#ops-room',
                color: 'danger',
                message: "The pipeline ${currentBuild.fullDisplayName} failed. ${env.BUILD_URL}"

            echo 'I failed :('
        }
        changed {
            echo 'Things were different before...'
        }
    }
}
