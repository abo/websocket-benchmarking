websocket-benchmarking
======================

NodeJS Websocket Benchmarking

## Socket.IO

* 配置 App, Nginx

  ```
    cd chat1
    npm install
    cd chat2
    npm install
  ```

  nginx.conf 修改:
  需要安装upsteam-hash-module, 按 hash($remote_addr.$remote_port)负载均衡

  ```
    worker_processes  4;
    ...
    events {
        worker_connections  65535;
    }

    http {
        ...
        upstream app {
            hash $remote_addr.$remote_port;
            #server 127.0.0.1:3000;
            #server 127.0.0.1:3001;
            server unix:/tmp/chat1.socket;
            server unix:/tmp/chat2.socket;
        }
        map $http_connection $upgrade_requested {
            default upgrade;
            '' close;
        }
        ...
        server{
            ...
            location / {
                proxy_buffering off;
                proxy_read_timeout 86400s;
                proxy_send_timeout 86400s;

                proxy_set_header Upgrade $http_upgrade;
                proxy_set_header Connection "upgrade";
                proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
                proxy_set_header Host $host;
                proxy_http_version 1.1;
                proxy_pass http://app;
                root   html;
                index  index.html index.htm;
            }
            ...
        }
        ...
    }

  ```


* 修改 websocket-bench

  ```
  npm install -g websocket-bench

  ```

  修改 websocket-bench 中依赖库的版本

  ```
  "socket.io-client": "~1.2.0",
  "engine.io-client": "~1.4.2",
  "socket.io": "~1.2.0",
  ```

  修改 websocket-bench 源码(lib/workers/socketioworker.js L20)

  ```
  var client = io.connect(this.server, {'transports': ['websocket'], 'force new connection' : true});
  ```

  ```
  cd {npm global dir}/websocket-bench
  npm install
  ```

* 系统参数调整

  ```
  sudo sysctl -w kern.maxfiles=1048600
  sudo sysctl -w kern.maxfilesperproc=1048576
  sudo sysctl -w net.inet.ip.portrange.first=10240
  ulimit -S -n 1048576
  ```

* 启动 App, Nginx (均需要调整ulimit)

  ```
  cd chat1
  node .
  cd chat2
  node .
  chmod 666 /tmp/chat1.socket
  chmod 666 /tmp/chat1.socket
  sudo nginx
  ```

* 启动 websocket-bench

  ```
  websocket-bench -a 100000 -c 100 -g generator.js -m 1 -k -v http://localhost:80
  ```
