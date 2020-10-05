# DNS task
## DNS client
### Реализовать в файле dns.js простой DNS-клиент
DNS-клиент должен предоставлять наружу три функции:

### setResolveServer(server)
устанавливает к какому DNS-серверу обращаться. server - строка, которая содержит либо IPv4 адрес, либо адрес формата IP:port. Если порт не указан, по умолчанию используется стандартный порт 53.
### resolve4(address, cb)
возвращает в callback лексикографически отсортированный массив IPv4-адресов (строк), соответствующих адресу domain, либо пустой массив, если DNS-сервер сообщает об отсутствии записей

### resolve6(address, cb)
возвращает в callback лексикографически отсортированный массив IPv6-адресов (строк), соответствующих адресу domain, либо пустой массив, если DNS-сервер сообщает об отсутствии записей. IPv6-адреса записаны согласно рекомендациям Википедии. Вы можете (но не обязаны) использовать пакет ip6addr для этого

Обе функции resolve4 и resolve6 используют node-style callbacks и не должны генерировать синхронные исключения. Если в течение 2000ms с момента запроса ответ не получен - resolve4 и resolve6 должны возвращать ошибку.
Для общения с DNS запрещено использовать модули dns, child_process, http и прочее - вы должны самостоятельно реализовать общение с DNS по протоколу UDP.

### В задаче используются следующие упрощения:

- секции серверов имен и секцию дополнительной информации можно игнорировать
- мы работаем только с DNS-запросами и ответами, которые умещаются в 512 байт
- Необходимо поддерживать только A и AAAA запросы
- DNS-запросе отсылаем ровно один вопрос к серверу (query)

### Первое знакомство со структурой DNS:

- http://www-inf.int-evry.fr/~hennequi/CoursDNS/NOTES-COURS_eng/msg.html
- http://citforum.ru/nets/semenov/4/44/dns_4412.shtml
- https://docstore.mik.ua/orelly/networking_2ndEd/dns/appa_02.htm
