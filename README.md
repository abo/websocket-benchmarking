websocket-benchmarking
======================

NodeJS Websocket Benchmarking

## Socket.IO(On MAC OS X)

* 配置 App, Nginx

  ```
    cd socket.io/chat1
    npm install
    cd socket.io/chat2
    npm install
  ```

  nginx.conf 修改:
  由于测试时所有Client都在本机, 而当前稳定版nginx(1.6.2)负载均衡算法不包含generic hash, 按ip_hash分配会导致所有请求都发到同一个后端几点, 所以需要安装upsteam-hash-module, 按 hash($remote_addr.$remote_port)负载均衡.
  
  upstream使用unix socket地址( unix:/tmp/chat1.socket )能减少local ip port的使用(系统配置中net.inet.ip.portrange的设置)

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
  websocket-bench中依赖版本策略会导致socket.io-client连接方式(transport) fall back到polling, 而不是websocket, 所以需要修改依赖版本及源码

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
  最大打开文件数，本地ip端口范围等

  ```
  sudo sysctl -w kern.maxfiles=1048600
  sudo sysctl -w kern.maxfilesperproc=1048576
  sudo sysctl -w net.inet.ip.portrange.first=10240
  ulimit -S -n 1048576
  ```

* 启动 App, Nginx (均需要调整ulimit)

  ```
  redis-server
  cd socket.io/chat1
  node .
  cd socket.io/chat2
  node .
  chmod 666 /tmp/chat1.socket
  chmod 666 /tmp/chat1.socket
  sudo nginx
  ```

* 启动 websocket-bench

  ```
  websocket-bench -a 100000 -c 100 -g generator.js -m 1 -k -v http://localhost:80
  ```


## SocketCluster
