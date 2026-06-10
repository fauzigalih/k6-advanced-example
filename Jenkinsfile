pipeline {
  agent any

  environment {
    K6_FILE    = "${params.TEST_FILE ?: 'tests/realistic-user-flow.js'}"
    K6_IMAGE   = "grafana/k6:latest"
    K6_VUS     = "${params.VUS ?: '1'}"
    INFLUXDB_URL  = "http://localhost:8086"
    INFLUXDB_ORG  = "sdet-workflow"
    INFLUXDB_BUCKET = "k6"
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
        withCredentials([string(credentialsId: 'influxdb-token', variable: 'INFLUXDB_TOKEN')]) {
          sh 'mkdir -p results && chmod 777 results'
          sh """
            docker run --rm \
              -v ${env.WORKSPACE}:/app \
              -e BUILD_NUMBER=${env.BUILD_NUMBER} \
              -e JOB_NAME=${env.JOB_NAME} \
              -e K6_INFLUXDB_ORGANIZATION=${INFLUXDB_ORG} \
              -e K6_INFLUXDB_BUCKET=${INFLUXDB_BUCKET} \
              -e K6_INFLUXDB_TOKEN=${INFLUXDB_TOKEN} \
              --user \$(id -u):\$(id -g) \
              --network host \
              ${K6_IMAGE} \
              run --vus ${K6_VUS} \
                  --out influxdb=${INFLUXDB_URL} \
                  /app/${K6_FILE}
          """
        }
      }
    }

    stage('Archive Results') {
      when {
        expression { fileExists('results/summary.json') }
      }
      steps {
        sh 'test -f results/summary.json || exit 1'
        sh 'test -f results/summary.html || exit 1'
        echo "📊 Results generated — Build #${env.BUILD_NUMBER}"
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