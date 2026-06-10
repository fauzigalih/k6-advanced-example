pipeline {
  agent any

  environment {
    K6_FILE         = "${params.TEST_FILE ?: 'tests/realistic-user-flow.js'}"
    K6_IMAGE        = "fauzigalih/k6-influxdb2:latest"
    K6_VUS          = "${params.VUS ?: '1'}"
    INFLUXDB_URL    = "http://localhost:8086"
    INFLUXDB_ORG    = "sdet-workflow"
    INFLUXDB_BUCKET = "k6"
    DOCKER_IMAGE    = "fauzigalih/k6-influxdb2"
  }

  parameters {
    string(name: 'TEST_FILE', defaultValue: 'tests/realistic-user-flow.js', description: 'File k6 yang dijalankan')
    string(name: 'VUS', defaultValue: '1', description: 'Jumlah Virtual Users')
    booleanParam(name: 'REBUILD_IMAGE', defaultValue: false, description: 'Build ulang Docker image k6-influxdb2')
    booleanParam(name: 'EXPORT_INFLUXDB', defaultValue: false, description: 'Kirim metrics ke InfluxDB + Grafana')
  }

  stages {

    stage('Checkout') {
      steps {
        checkout scm
      }
    }

    stage('Build & Push Image') {
      when {
        expression { params.REBUILD_IMAGE == true }
      }
      steps {
        withCredentials([usernamePassword(
          credentialsId: 'dockerhub-credentials',
          usernameVariable: 'DOCKER_USER',
          passwordVariable: 'DOCKER_PASS'
        )]) {
          sh 'echo $DOCKER_PASS | docker login -u $DOCKER_USER --password-stdin'
          sh "docker build -t ${DOCKER_IMAGE}:latest ."
          sh "docker push ${DOCKER_IMAGE}:latest"
          sh 'docker logout'
          echo "✅ Image ${DOCKER_IMAGE}:latest berhasil di-push ke Docker Hub"
        }
      }
    }

    stage('Validate') {
      steps {
        sh 'test -f ${K6_FILE} || exit 1'
        sh 'docker --version'
        sh "docker pull ${K6_IMAGE}"
      }
    }

    stage('Performance Test') {
      steps {
        withCredentials([string(credentialsId: 'influxdb-token', variable: 'INFLUXDB_TOKEN')]) {
          sh 'mkdir -p results && chmod 777 results'
          script {
            def influxdbOut = params.EXPORT_INFLUXDB
              ? "--out xk6-influxdb=${INFLUXDB_URL}"
              : ""

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
                    ${influxdbOut} \
                    /app/${K6_FILE}
            """
          }
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
        echo "📡 InfluxDB export: ${params.EXPORT_INFLUXDB ? 'YES — data sent to Grafana' : 'NO — local only'}"
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