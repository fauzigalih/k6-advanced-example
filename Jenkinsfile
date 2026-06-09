pipeline {
  agent any

  environment {
    K6_FILE    = "${params.TEST_FILE ?: 'tests/realistic-user-flow.js'}"
    K6_IMAGE   = "grafana/k6:latest"
    K6_VUS     = "${params.VUS ?: '1'}"
  }

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
        sh 'test -f ${K6_FILE} || exit 1'
        sh 'docker --version'
        sh 'docker pull ${K6_IMAGE}'
      }
    }

    stage('Performance Test') {
      steps {
        sh """
          docker run --rm \
            -v ${env.WORKSPACE}:/app \
            ${K6_IMAGE} \
            run --vus ${K6_VUS} /app/${K6_FILE}
        """
      }
    }

  }

  post {
    always {
      archiveArtifacts artifacts: 'results/**', allowEmptyArchive: true
    }
    success {
      echo "✅ Performance test PASSED — all thresholds met! (VUs: ${K6_VUS})"
    }
    failure {
      echo "❌ Performance test FAILED — threshold violated! (VUs: ${K6_VUS})"
    }
  }
}