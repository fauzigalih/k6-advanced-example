pipeline {
  agent any

  parameters {
    string(name: 'TEST_FILE', defaultValue: 'tests/realistic-user-flow.js', description: 'File k6 yang dijalankan')
    string(name: 'VUS', defaultValue: '1', description: 'Jumlah Virtual Users')
  }

  stages {

    stage('Checkout') {
      steps {
        checkout scm
      }
    }

    stage('Validate') {
      steps {
        sh 'test -f ${TEST_FILE} || exit 1'
        sh 'k6 version'
      }
    }

    stage('Performance Test') {
      steps {
        sh 'k6 run --vus ${VUS} ${TEST_FILE}'
      }
    }

  }

  post {
    always {
      archiveArtifacts artifacts: 'results/**', allowEmptyArchive: true
    }
    success {
      echo "✅ Performance test PASSED — all thresholds met!"
    }
    failure {
      echo "❌ Performance test FAILED — threshold violated!"
    }
  }
}