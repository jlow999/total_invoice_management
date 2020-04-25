# total_invoice_managment
https://medium.com/hackernoon/getting-started-with-microservices-and-kubernetes-76354312b556

## 1. Building `invoices_svc`

### Set working  folder:
```
$ cd invoices_svc
```

### Build the docker image:
```
$ docker build -t invoices_svc:v1 .
```

### Console output
```
$ docker build -t invoices_svc:v1 .

Sending build context to Docker daemon  36.86kB
Step 1/7 : FROM node:carbon
 ---> 8eeadf3757f4
Step 2/7 : WORKDIR /usr/src/app
 ---> Using cache
 ---> 93eb8192c8ea
Step 3/7 : COPY package*.json ./
 ---> Using cache
 ---> fb7dbab77e4c
Step 4/7 : RUN npm install
 ---> Running in cfc7c2d1e4d9
npm WARN invoices_svc@1.0.0 No description
npm WARN invoices_svc@1.0.0 No repository field.

added 105 packages from 90 contributors and audited 197 packages in 4.184s
found 0 vulnerabilities

Removing intermediate container cfc7c2d1e4d9
 ---> 36341bcf077a
Step 5/7 : COPY . .
 ---> 815c01316afe
Step 6/7 : EXPOSE 8080
 ---> Running in ada4788d8590
Removing intermediate container ada4788d8590
 ---> ef621640152a
Step 7/7 : CMD [ "npm", "start" ]
 ---> Running in 143a2207e2a0
Removing intermediate container 143a2207e2a0
 ---> c52cfab4ce8d
Successfully built c52cfab4ce8d
Successfully tagged invoices_svc:v1
```

### Apply the kube config:
```
$ kubectl apply -f ../kube/invoices_svc.yaml
```

### See if it worked:
```
$ curl http://192.168.64.2:31185/invoices/42
```

## 2. Building auth_svc

### Set working  folder:
```
$ cd auth_svc
```

### Build the docker image:
```
$ docker build ./ -t auth_svc:v1
```

### Apply the kube config:
```
$ kubectl create -f ../kube/auth_svc.yaml
```

### See if it worked:
```
$ curl http://192.168.64.2:31185/invoices/42
{"ok":false}

$ curl http://192.168.64.2:31185/invoices/42 -H 'authorization: letmeinpleasekthxbye'
{"id":42,"ref":"INV-42","amount":4200,"balance":4190,"ccy":"GBP"}
```

## 3. Building expected_date_svc

### Set working  folder:
```
$ cd expected_date_svc
```

### Build the docker image:
```
$ docker build ./ -t expected_date_svc:v1
```

### Apply the kube config:
```
$ kubectl create -f ../kube/expected_date_svc.yaml
```

### See if it worked:
```
$ kubectl get services
NAME                CLUSTER-IP       EXTERNAL-IP   PORT(S)          AGE
ambassador          10.103.215.136   <pending>     80:32005/TCP     19h
ambassador-admin    10.104.3.82      <nodes>       8877:31385/TCP   19h
auth-svc            10.108.119.134   <none>        3000/TCP         18h
expected-date-svc   10.101.227.50    <none>        80/TCP           1m
invoices-svc        10.104.86.220    <none>        80/TCP           20h
kubernetes          10.96.0.1        <none>        443/TCP          21h

$ curl 10.101.227.50/api/expected-date/2
{"invoiceId":2,"expectedDate":"2020-04-29T00:33:30.678Z"}
```

## 4. Building invoices_svc:v2

### Set working  folder:
```
$ cd invoices_svc
```

### Build the docker image:
```
$ docker build ./ -t invoices_svc:v2
```

### Update invoices_svc.ymal to reference the new docker image (line 25):
```
spec:
  containers:
  - image: invoices_svc:v2
    imagePullPolicy: IfNotPresent
    name: invoices-svc
    env:
    - name: EXPECTED_DATE_URI
      value: http://expected-date-svc.default.svc.cluster.local
```

### Apply the changes to cluster:
```
$ kubectl apply -f ../kube/invoices_svc.yaml
```

### And check that the expected date is being added: 
```
$ curl http://192.168.64.2:31185/invoices/42 -H 'authorization: letmeinpleasekthxbye'

{"id":42,"ref":"INV-42","amount":4200,"balance":4190,"ccy":"GBP","expectedDate":"2018-01-01T11:54:30.769Z"}
```

### Check pods/services/deployments: 

```
$ kubectl get all

NAME                                     READY   STATUS    RESTARTS   AGE
pod/ambassador-d9ff7c98c-dtlj9           2/2     Running   0          4h12m
pod/ambassador-d9ff7c98c-nd4js           2/2     Running   0          4h12m
pod/ambassador-d9ff7c98c-vf8sl           2/2     Running   0          4h12m
pod/auth-svc-699694967c-fk6rd            1/1     Running   0          35m
pod/auth-svc-699694967c-gjsb5            1/1     Running   0          35m
pod/auth-svc-699694967c-qmz24            1/1     Running   0          35m
pod/curl-5858f4ff79-zd9w8                1/1     Running   1          4h48m
pod/expected-date-svc-7756584995-7wj8t   1/1     Running   0          16m
pod/expected-date-svc-7756584995-gbnb2   1/1     Running   0          16m
pod/expected-date-svc-7756584995-jb628   1/1     Running   0          16m
pod/invoices-svc-5bbbb4b9ff-2v9nk        1/1     Running   0          2m33s
pod/invoices-svc-5bbbb4b9ff-kxwc7        1/1     Running   0          2m35s
pod/invoices-svc-5bbbb4b9ff-mk9nq        1/1     Running   0          2m35s


NAME                        TYPE           CLUSTER-IP       EXTERNAL-IP   PORT(S)          AGE
service/ambassador          LoadBalancer   10.105.201.156   <pending>     80:31185/TCP     4h40m
service/ambassador-admin    NodePort       10.96.166.105    <none>        8877:30021/TCP   4h44m
service/auth-svc            ClusterIP      10.111.225.76    <none>        3000/TCP         35m
service/expected-date-svc   ClusterIP      10.107.252.127   <none>        80/TCP           16m
service/invoices-svc        ClusterIP      10.96.97.110     <none>        80/TCP           83m
service/kubernetes          ClusterIP      10.96.0.1        <none>        443/TCP          9d


NAME                                READY   UP-TO-DATE   AVAILABLE   AGE
deployment.apps/ambassador          3/3     3            3           4h12m
deployment.apps/auth-svc            3/3     3            3           35m
deployment.apps/curl                1/1     1            1           4h48m
deployment.apps/expected-date-svc   3/3     3            3           16m
deployment.apps/invoices-svc        3/3     3            3           5h33m

NAME                                           DESIRED   CURRENT   READY   AGE
replicaset.apps/ambassador-d9ff7c98c           3         3         3       4h12m
replicaset.apps/auth-svc-699694967c            3         3         3       35m
replicaset.apps/curl-5858f4ff79                1         1         1       4h48m
replicaset.apps/expected-date-svc-7756584995   3         3         3       16m
replicaset.apps/invoices-svc-55c96f75f4        0         0         0       5h33m
replicaset.apps/invoices-svc-5bbbb4b9ff        3         3         3       2m35s
```

### Check docker images: 
```
$ docker image ls

REPOSITORY                                TAG                 IMAGE ID            CREATED             SIZE
invoices_svc                              v2                  07274ea2cfe6        15 minutes ago      920MB
expected_date_svc                         v1                  854a9665a27a        21 minutes ago      907MB
auth_svc                                  v1                  7ddf598f9751        41 minutes ago      904MB
invoices_svc                              v1                  67058380d799        6 hours ago         920MB
k8s.gcr.io/kube-proxy                     v1.18.0             43940c34f24f        2 weeks ago         117MB
k8s.gcr.io/kube-apiserver                 v1.18.0             74060cea7f70        2 weeks ago         173MB
k8s.gcr.io/kube-scheduler                 v1.18.0             a31f78c7c8ce        2 weeks ago         95.3MB
k8s.gcr.io/kube-controller-manager        v1.18.0             d3e55153f52f        2 weeks ago         162MB
kubernetesui/dashboard                    v2.0.0-rc6          cdc71b5a8a0e        4 weeks ago         221MB
k8s.gcr.io/pause                          3.2                 80d28bedfe5d        2 months ago        683kB
k8s.gcr.io/coredns                        1.6.7               67da37a9a360        2 months ago        43.8MB
node                                      carbon              8eeadf3757f4        3 months ago        901MB
kubernetesui/dashboard                    v2.0.0-beta8        eb51a3597525        4 months ago        90.8MB
kindest/kindnetd                          0.5.3               aa67fec7d7ef        5 months ago        78.5MB
k8s.gcr.io/etcd                           3.4.3-0             303ce5db0e90        5 months ago        288MB
kubernetesui/metrics-scraper              v1.0.2              3b08661dc379        5 months ago        40.1MB
kubernetesui/metrics-scraper              v1.0.1              709901356c11        9 months ago        40.1MB
datawire/statsd                           0.19.2              7058f4889117        2 years ago         63.2MB
datawire/ambassador                       0.19.2              e843506b854e        2 years ago         616MB
gcr.io/k8s-minikube/storage-provisioner   v1.8.1              4689081edb10        2 years ago         80.8MB
radial/busyboxplus                        curl                71fa7369f437        5 years ago         4.23MB
```

## Web UI (Dashboard)
https://kubernetes.io/docs/tasks/access-application-cluster/web-ui-dashboard/

1. Deploying the Dashboard UI
$ kubectl apply -f https://raw.githubusercontent.com/kubernetes/dashboard/v2.0.0-beta8/aio/deploy/recommended.yaml

2. Accessing the Dashboard UI
$ kubectl apply -f https://raw.githubusercontent.com/kubernetes/dashboard/v2.0.0-beta8/aio/deploy/recommended.yaml

3. creating a sample user
https://github.com/kubernetes/dashboard/blob/master/docs/user/access-control/creating-sample-user.md

4. Apply service account
$ kubectl apply -f ./dashboard-adminuser.yaml

5. Get Access Token
kubectl -n kubernetes-dashboard describe secret $(kubectl -n kubernetes-dashboard get secret | grep admin-user | awk '{print $1}')

6. Start the service
$ kubectl proxy

7. Open Dashboard in web browser
http://localhost:8001/api/v1/namespaces/kubernetes-dashboard/services/https:kubernetes-dashboard:/proxy/


#### View container logs for debugging
```
$ kubectl logs -p invoices-svc-xxxxxx-xxxxx
```

#### URL for localhost
```
$ minikube service ambassador --url
```

#### Enable kubectl
```
$ sudo swapoff -a
```

#### Find space used on Raspberry Pi
```
$ df -h

Filesystem      Size  Used Avail Use% Mounted on
udev            1.9G     0  1.9G   0% /dev
tmpfs           391M  2.7M  389M   1% /run
/dev/sda1        32G   11G   20G  35% /
tmpfs           2.0G   23M  1.9G   2% /dev/shm
tmpfs           5.0M  4.0K  5.0M   1% /run/lock
tmpfs           2.0G     0  2.0G   0% /sys/fs/cgroup
/dev/loop0      4.3M  4.3M     0 100% /snap/gnome-calculator/544
/dev/loop2       15M   15M     0 100% /snap/gnome-characters/399
/dev/loop3       90M   90M     0 100% /snap/core/8268
/dev/loop1       55M   55M     0 100% /snap/gtk-common-themes/1502
/dev/loop4      1.0M  1.0M     0 100% /snap/gnome-logs/93
/dev/loop5       94M   94M     0 100% /snap/core/8935
/dev/loop6      3.8M  3.8M     0 100% /snap/gnome-system-monitor/135
/dev/loop7       55M   55M     0 100% /snap/core18/1668
/dev/loop8       49M   49M     0 100% /snap/gtk-common-themes/1474
/dev/loop9      1.0M  1.0M     0 100% /snap/gnome-logs/81
/dev/loop10     3.8M  3.8M     0 100% /snap/gnome-system-monitor/127
/dev/loop11      15M   15M     0 100% /snap/gnome-characters/495
/dev/loop12     161M  161M     0 100% /snap/gnome-3-28-1804/116
/dev/loop13      55M   55M     0 100% /snap/core18/1705
/dev/loop14     4.4M  4.4M     0 100% /snap/gnome-calculator/704
tmpfs           391M   16K  391M   1% /run/user/121
tmpfs           391M   36K  391M   1% /run/user/1000
```

#### Delete pod forcefully
```
kubectl delete pod <PODNAME> --grace-period=0 --force --namespace <NAMESPACE>
```
```
$ kubectl delete pod auth-svc-f9d69897f-vzbd7 --grace-period=0 --force

warning: Immediate deletion does not wait for confirmation that the running resource has been terminated. The resource may continue to run on the cluster indefinitely.
```

#### Master Node installation notes
```
Your Kubernetes control-plane has initialized successfully!

To start using your cluster, you need to run the following as a regular user:

  mkdir -p $HOME/.kube
  sudo cp -i /etc/kubernetes/admin.conf $HOME/.kube/config
  sudo chown $(id -u):$(id -g) $HOME/.kube/config

You should now deploy a pod network to the cluster.
Run "kubectl apply -f [podnetwork].yaml" with one of the options listed at:
  https://kubernetes.io/docs/concepts/cluster-administration/addons/

Then you can join any number of worker nodes by running the following on each as root:

sudo swapoff -a
sudo kubeadm join 192.168.174.152:6443 --token 525ah9.dhngkhnqkdfjxf59 --discovery-token-ca-cert-hash sha256:9fdc5a28fa64045f5923bd98472144da56ed56d98a8342dfae08b1797d97c876
```

#### kubeadm token generate command
This command will print out a randomly-generated bootstrap token that can be used with the “init” and “join” commands.

```
$ kubeadm token generate

n0xphk.2pvfkn18pzyvlufr
```

The run the command: 

```
$ kubeadm token create n0xphk.2pvfkn18pzyvlufr --print-join-command --ttl=0

WARNING: kubeadm cannot validate component configs for API groups [kubelet.config.k8s.io kubeproxy.config.k8s.io]
kubeadm join 192.168.174.152:6443 --token n0xphk.2pvfkn18pzyvlufr     --discovery-token-ca-cert-hash sha256:9fdc5a28fa64045f5923bd98472144da56ed56d98a8342dfae08b1797d97c876
```

#### Run below command to remove the taint from master node and then you should be able to deploy your pod on that node
```
$ kubectl get nodes
NAME          STATUS   ROLES    AGE     VERSION
master-node   Ready    master   7d19h   v1.18.2
slave-node    Ready    <none>   7d19h   v1.18.2

$ kubectl taint nodes master-node node-role.kubernetes.io/master-
node/master-node untainted
```

#### Curl into container
### Busyboxplus is just a container that has a basic shell and some common tools. 
```
$ kubectl run curl --image=radial/busyboxplus:curl -i --tty

[ root@curl-696777f579-qwjcr:/ ]$ curl 10.104.86.220/api/invoices/1
{"id":1,"ref":"INV-1","amount":100,"balance":90,"ccy":"GBP"}
```

#### Get IP addresses of the pods
```
$ kubectl get pods -o wide

NAME                                 READY   STATUS    RESTARTS   AGE     IP            NODE          NOMINATED NODE   READINESS GATES
auth-svc-f9d69897f-6scct             1/1     Running   0          3h4m    10.244.1.48   slave-node    <none>           <none>
auth-svc-f9d69897f-l8vns             1/1     Running   0          3h4m    10.244.0.15   master-node   <none>           <none>
auth-svc-f9d69897f-whmzm             1/1     Running   0          3h4m    10.244.1.49   slave-node    <none>           <none>
curl                                 1/1     Running   1          5h59m   10.244.1.46   slave-node    <none>           <none>
expected-date-svc-6d96c4d8bf-7ng5f   1/1     Running   0          6h31m   10.244.0.12   master-node   <none>           <none>
expected-date-svc-6d96c4d8bf-bwgkb   1/1     Running   0          6h31m   10.244.0.11   master-node   <none>           <none>
expected-date-svc-6d96c4d8bf-pckcf   1/1     Running   0          6h31m   10.244.0.10   master-node   <none>           <none>
invoices-svc-5f658b5989-6jzl4        1/1     Running   2          5h37m   10.244.1.47   slave-node    <none>           <none>
invoices-svc-5f658b5989-gpxhb        1/1     Running   0          5h37m   10.244.0.13   master-node   <none>           <none>
invoices-svc-5f658b5989-lp9xb        1/1     Running   0          5h37m   10.244.0.14   master-node   <none>           <none>
```
