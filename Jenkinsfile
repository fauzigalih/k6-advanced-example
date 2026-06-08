pipeline {
  agent any

  stages {

    stage('Checkout') {
      steps {
        checkout scm
      }
    }

    stage('Validate') {
      steps {
        sh 'test -f tests/realistic-user-flow.js || exit 1'
        sh 'k6 version'
      }
    }

    stage('Performance Test') {
      steps {
        sh 'k6 run tests/realistic-user-flow.js'
      }
    }

  }

  post {
    always {
      archiveArtifacts artifacts: 'results/**', allowEmptyArchive: true
    }
    success {
      echo 'Performance test PASSED — all thresholds met!'
    }
    failure {
      echo 'Performance test FAILED — threshold violated!'
    }
  }
}