// Простой клиент для ИРБИС64

module NodeIrbis {

    export const UTF_ENCODING = 'UTF-8';
    export const ANSI_ENCODING = 'Windows-1251';

    // Статус записи

    export const LOGICALLY_DELETED  = 1;  // Запись логически удалена
    export const PHYSICALLY_DELETED = 2;  // Запись физически удалена
    export const ABSENT             = 4;  // Запись отсутствует
    export const NON_ACTUALIZED     = 8;  // Запись не актуализирована
    export const LAST_VERSION       = 32; // Последняя версия записи
    export const LOCKED_RECORD      = 64; // Запись заблокирована на ввод

    // Распространённые форматы

    export const ALL_FORMAT       = "&uf('+0')"; // Полные данные по полям
    export const BRIEF_FORMAT     = '@brief';    // Краткое библиографическое описание
    export const IBIS_FORMAT      = '@ibiskw_h'; // Формат IBIS (старый)
    export const INFO_FORMAT      = '@info_w';   // Информационный формат
    export const OPTIMIZED_FORMAT = '@';         // Оптимизированный формат

    // Распространённые поиски

    export const KEYWORD_PREFIX    = 'K=';  // Ключевые слова
    export const AUTHOR_PREFIX     = 'A=';  // Индивидуальный автор, редактор, составитель
    export const COLLECTIVE_PREFIX = 'M=';  // Коллектив или мероприятие
    export const TITLE_PREFIX      = 'T=';  // Заглавие
    export const INVENTORY_PREFIX  = 'IN='; // Инвентарный номер, штрих-код или радиометка
    export const INDEX_PREFIX      = 'I=';  // Шифр документа в базе

    // Логические операторы для поиска

    export const LOGIC_OR                = 0; // Только ИЛИ
    export const LOGIC_OR_AND            = 1; // ИЛИ и И
    export const LOGIC_OR_AND_NOT        = 2; // ИЛИ, И, НЕТ (по умолчанию)
    export const LOGIC_OR_AND_NOT_FIELD  = 3; // ИЛИ, И, НЕТ, И (в поле)
    export const LOGIC_OR_AND_NOT_PHRASE = 4; // ИЛИ, И, НЕТ, И (в поле), И (фраза)

    // Коды АРМ

    export const ADMINISTRATOR = 'A'; // Адмнистратор
    export const CATALOGER     = 'C'; // Каталогизатор
    export const ACQUSITIONS   = 'M'; // Комплектатор
    export const READER        = 'R'; // Читатель
    export const CIRCULATION   = 'B'; // Книговыдача
    export const BOOKLAND      = 'B'; // Книговыдача
    export const PROVISITON    = 'K'; // Книгообеспеченность

    /**
     * Разделитель строк в ИРБИС.
     */
    export const IRBIS_DELIMITER = "\x1F\x1E";

    /**
     * Короткая версия разделителя строк ИРБИС.
     */
    export const SHORT_DELIMITER = "\x1E";

    /**
     * Пустая ли данная строка?
     *
     * @param text Строка для изучения.
     */
    function isNullOrEmpty(text: string) : boolean {
        return (text == null) || text == '';
    }

    /**
     * Удаление комментариев из строки.
     *
     * @param text Текст для удаления комментариев.
     */
    function removeComments(text: string) {
        if (isNullOrEmpty(text)) {
            return text;
        }

        if (text.indexOf('/*') < 0) {
            return text;
        }

        let result = '';
        let state = '';
        let index = 0;
        let length = text.length;

        while (index < length) {
            let c = text[index];

            switch (state) {
                case "'":
                case '"':
                case '|':
                    if (c == state) {
                        state = '';
                    }

                    result += c;
                    break;

                default:
                    if (c == '/') {
                        if (index + 1 < length && text[index + 1] == '*') {
                            while (index < length) {
                                c = text[index];
                                if (c == "\r" || c == "\n") {
                                    result += c;
                                    break;
                                }

                                index++;
                            }
                        }
                        else {
                            result += c;
                        }
                    }
                    else if (c == "'" || c == '"' || c == '|') {
                        state = c;
                        result += c;
                    }
                    else {
                        result += c;
                    }
                    break;
            }

            index++;
        }

        return result;
    }

    /**
     * Подготовка динамического формата
     * для передачи на сервер.
     *
     * В формате должны отсутствовать комментарии
     * и служебные символы (например, перевод
     * строки или табуляция).
     *
     * @param text Текст для обработки.
     */
    export function prepareFormat (text: string) {
        text = removeComments(text);
        let length = text.length;
        if (length == 0) {
            return text;
        }

        let flag = false;
        for (let i: number = 0; i < length; i++) {
            if (text[i] < ' ') {
                flag = true;
                break;
            }
        }

        if (!flag) {
            return text;
        }

        let result = '';
        for (let i: number = 0; i < length; i++) {
            let c = text[i];
            if (c >= ' ') {
                result += c;
            }
        }

        return result;
    }

    /**
     * Подполе с кодом и значением.
     */
    export class SubField {

        constructor(public code: string, public value: string) {
            // Nothing to do here yet
        }

        public validate(throwOnError: boolean): boolean {
            // TODO implement

            return true;
        }
    }

    /**
     * Поле записи с меткой, значением и подполями.
     */
    export class RecordField {

        /**
         * Подполя.
         */
        public subfields: SubField[];

        constructor(public tag: number, public value: string) {
            this.subfields = [];
        }

        /**
         * Добавление подполя с указанными кодом и значением.
         *
         * @param code Код подполя.
         * @param value Значение подполя.
         */
        public add(code: string, value: string) : RecordField {
            let subfield = new SubField(code, value);
            this.subfields.push(subfield);

            return this;
        }

        public validate(throwOnError: boolean): boolean {
            // TODO implement

            return true;
        }
    }

    /**
     * Запись с полями.
     */
    export class MarcRecord {

        /**
         * Имя базы данных. Для вновь созданных записей пустая строка.
         */
        public database: string = '';

        /**
         * MFN записи. Для вновь созданных записей 0.
         */
        public mfn: number = 0;

        /**
         * Статус записи.
         */
        public status: number = 0;

        /**
         * Версия записи.
         */
        public version: number = 0;

        /**
         * Массив полей.
         */
        public fields: RecordField[];

        /**
         * Добавление в конец массива поля с указанными меткой и значением.
         *
         * @param tag Метка поля.
         * @param value Значение поля до первого разделителя.
         * @return Созданное поле.
         */
        public add(tag: number, value: string = '') : RecordField {
            let field = new RecordField(tag, value);
            this.fields.push(field);

            return field;
        }

        public decode(lines: string[]) : void {
            // TOD implement
        }

        public encode() : string {
            // TODO implement
            return '';
        }

        public validate(throwOnError: boolean = true) : boolean {
            // TODO implement
            return true;
        }
    }

    /**
     * Клиентский запрос.
     */
    export class ClientQuery {

        constructor(connection: IrbisConnection, command: string) {
            this.addAnsi(command).newLine();
            this.addAnsi(connection.workstation).newLine();
            this.addAnsi(command).newLine();
            this.add(connection.clientId).newLine();
            this.add(connection.queryId).newLine();
            this.addAnsi(connection.password).newLine();
            this.addAnsi(connection.username).newLine();
            this.newLine();
            this.newLine();
            this.newLine();
        }

        /**
         * Добавляем целое число
         * (по факту выходит кодировка ANSI).
         *
         * @param value Число
         * @return this
         */
        public add(value: number) : ClientQuery {
            return this.addAnsi(value.toString());
        }

        /**
         * Добавляем текст в кодировке ANSI.
         * @param value
         * @return this
         */
        public addAnsi(value: string) : ClientQuery {
            // TODO implement
            return this;
        }

        /**
         * Добавляем текст в кодировке UTF-8.
         * @param value
         * @return this
         */
        public addUtf(value: string) : ClientQuery {
            // TODO implement
            return this;
        }

        /**
         * Добавляем перевод строки.
         * @return this
         */
        public newLine() : ClientQuery {
            // TODO implement
            return this;
        }
    }

    /**
     * Ответ сервера.
     */
    export class ServerResponse {
        public command: string = '';
        public clientId: number = 0;
        public queryId: number = 0;
        public returnCode: number = 0;
        public answerSize: number = 0;
        public serverVersion: string = '';

        constructor(socket) {
            // TODO implement
        }

        public checkReturnCode() : void {
            // TODO implement
        }

        public getLine() : string {
            // TODO implement
            return '';
        }

        public getReturnCode() : number {
            // TODO implement
            return 0;
        }

        public readAnsi() : string {
            // TODO implement
            return '';
        }

        public readInteger() : number {
            // TODO implement
            return 0;
        }

        public readRemainingAnsiLines() : string[] {
            // TODO implement
            return [];
        }

        public readRemainingAnsiText() : string {
            // TODO implement
            return '';
        }

        public readRemainingUtfLines() : string[] {
            // TODO implement
            return [];
        }

        public readRemainingUtfText() : string {
            // TODO implement
            return '';
        }

        public readUtf() : string {
            // TODO implement
            return '';
        }
    }

    /**
     * Подключение к ИРБИС-серверу.
     */
    export class IrbisConnection {
        public host: string = '127.0.0.1';
        public port: number = 6666;
        public username: string = '';
        public password: string = '';
        public database: string = 'IBIS';
        public workstation: string = CATALOGER;
        public clientId: number = 0;
        public queryId: number = 0;
        public serverVersion: string = '';
        public iniFile = null;
        public interval: number = 0;

        private connected: boolean = false;

        /**
         * Актуализация записи с указанным MFN.
         *
         * @param database Имя базы данных.
         * @param mfn MFN, подлежащий актуализации.
         * @return boolean Признак успешности операции.
         */
        public actualizeRecord(database: string, mfn: number) : boolean {
            if (!this.connected) {
                return false;
            }

            let query = new ClientQuery(this, 'F');
            query.addAnsi(database).newLine();
            query.add(mfn).newLine();
            let response = this.execute(query);
            response.checkReturnCode();

            return true;
        }

        /**
         * Подключение к серверу ИРБИС64.
         * @return boolean Признак успешности операции.
         */
        public connect() : boolean {
            if (this.connected) {
                return true;
            }

            while (true) {
                this.clientId = 100000 + Math.floor(Math.random() * 900000);
                this.queryId = 1;

                let query = new ClientQuery(this, 'A');
                query.addAnsi(this.username).newLine();
                query.addAnsi(this.password);

                let response = this.execute(query);
                response.getReturnCode();
                if (response.returnCode == -3337) {
                    continue;
                }

                if (response.returnCode < 0) {
                    return false;
                }

                this.connected = true;
                this.serverVersion = response.serverVersion;
                this.interval = parseInt(response.readUtf());
                this.iniFile = null; // TODO implement

                return true;
            }
        }

        /**
         * Создание базы данных.
         *
         * @param database Имя создаваемой базы.
         * @param description Описание в свободной форме.
         * @param readerAccess Читатель будет иметь доступ?
         * @return boolean Признак успешности операции.
         */
        public createDatabase(database: string, description: string, readerAccess: number = 1) : boolean {
            if (!this.connected) {
                return false;
            }

            let query = new ClientQuery(this, 'T');
            query.addAnsi(database).newLine();
            query.addAnsi(description).newLine();
            query.add(readerAccess).newLine();

            let response = this.execute(query);
            response.checkReturnCode();

            return true;
        }

        /**
         * Создание словаря в указанной базе данных.
         *
         * @param database Имя базы данных.
         * @return boolean Признак успешности операции.
         */
        public createDictionary(database: string) : boolean {
            if (!this.connected) {
                return false;
            }

            let query = new ClientQuery(this, 'Z');
            query.addAnsi(database).newLine();
            let response = this.execute(query);
            response.checkReturnCode();

            return true;
        }

        /**
         * Удаление указанной базы данных.
         *
         * @param database Имя удаляемой базы данных.
         * @return boolean Признак успешности операции.
         */
        public deleteDatabase(database: string) : boolean {
            if (!this.connected) {
                return false;
            }

            let query = new ClientQuery(this, 'W');
            query.addAnsi(database).newLine();
            let response = this.execute(query);
            response.checkReturnCode();

            return true;
        }

        /**
         * Удаление записи по её MFN.
         *
         * @param mfn MFN удаляемой записи.
         * @return boolean Признак успешности операции.
         */
        public deleteRecord(mfn: number) : boolean {
            // TODO implement
            return false;
        }

        /**
         *  Отключение от сервера.
         *
         *  @return boolean Признак успешности операции
         *  (по факту всегда true).
         */
        public disconnect() : boolean {
            if (!this.connected) {
                return true;
            }

            let query = new ClientQuery(this, 'B');
            query.addAnsi(this.username);
            this.execute(query);
            this.connected = false;

            return true;
        }

        /**
         * Отправка клиентского запроса на сервер
         * и получение от него.
         *
         * @param query Клиентский запрос.
         * @return ServerResponse Ответ сервера.
         */
        public execute(query: ClientQuery) : ServerResponse {
            // TODO implement
            this.queryId++;
            return new ServerResponse(123);
        }

        /**
         * Форматирование записи с указанным MFN.
         *
         * @param format Текст формата.
         * @param mfn MFN записи
         * @throws IrbisException
         */
        public formatRecord(format: string, mfn: number) : string {
            if (!this.connected) {
                return '';
            }

            let query = new ClientQuery(this, 'G');
            query.addAnsi(this.database).newLine();
            let prepared = prepareFormat(format);
            query.addAnsi(prepared).newLine();
            query.add(1).newLine();
            query.add(mfn).newLine();
            let response = this.execute(query);
            response.checkReturnCode();
            let result = response.readRemainingUtfText();

            return result;
        }

        /**
         * Получение максимального MFN для указанной базы данных.
         *
         * @param database Имя базы данных.
         * @throws IrbisException
         */
        public getMaxMfn(database: string) : number {
            if (!this.connected) {
                return 0;
            }

            let query = new ClientQuery(this, 'O');
            query.addAnsi(database);
            let response = this.execute(query);
            response.checkReturnCode();

            return response.returnCode;
        }

        /**
         * Получение списка файлов.
         *
         * @param specification Спецификация.
         */
        public listFiles(specification: string) : string[] {
            if (!this.connected) {
                return [];
            }
            
            let query = new ClientQuery(this, '!');
            query.addAnsi(specification).newLine();
            let response = this.execute(query);
            let lines = response.readRemainingAnsiLines();
            let result = [];
            for (let line of lines) {
                // TODO implement
                result.push(line);
            }
            
            return result;
        }

        /**
         * Получение статуса, подключен ли клиент в настоящее время.
         *
         * @return boolean Подключен?
         */
        public isConnected() : boolean {
            return this.connected;
        }

        /**
         * Пустая операция (используется для периодического
         * подтверждения подключения клиента).
         *
         * @return Всегда true при наличии подключения,
         * т. к. код возврата не анализируется.
         * Всегда false при отсутствии подключения.
         */
        public noOp() : boolean {
            if (!this.connected) {
                return false;
            }

            let query = new ClientQuery(this, 'N');
            this.execute(query);

            return true;
        }

        /**
         * Разбор строки подключения.
         *
         * @param connectionString Строка подключения.
         * @throws IrbisException
         */
        public parseConnectionString(connectionString: string) : void {
            // TODO implement
        }

        /**
         * Разблокирование записей.
         *
         * @param database База данных.
         * @param mfnList Массив MFN.
         * @return bool
         */
        public unlockRecords(database : string, mfnList: number[]) : boolean {
            if (this.connected) {
                return false;
            }

            if (mfnList.length == 0) {
                return true;
            }

            if (isNullOrEmpty(database)) {
                database = this.database;
            }

            let query = new ClientQuery(this, 'Q');
            query.addAnsi(database).newLine();
            for (let mfn of mfnList) {
                query.add(mfn).newLine();
            }

            this.execute(query);

            return true;
        }

        /**
         * Сохранение записи на сервере.
         *
         * @param record Запись для сохранения (новая или ранее считанная).
         * @param lockFlag Оставить запись заблокированной?
         * @param actualize Актуализировать словарь?
         * @param dontParse Не разбирать результат.
         * @throws IrbisException
         */
        public writeRecord(record: MarcRecord, lockFlag: number = 0, actualize: number = 1,
            dontParse: boolean = false) : number {
            if (!this.connected) {
                return 0;
            }

            let database = record.database;
            if (isNullOrEmpty(database)) {
                database = this.database;
            }
            let query = new ClientQuery(this, 'D');
            query.addAnsi(database).newLine();
            query.add(lockFlag).newLine();
            query.add(actualize).newLine();
            query.addUtf(record.encode()).newLine();
            let response = this.execute(query);
            response.checkReturnCode();
            if (!dontParse) {
                record.fields = [];
                let temp = response.readRemainingUtfLines();
                let lines = [temp[0]];
                // lines = array_merge($lines, explode(SHORT_DELIMITER, $temp[1]));
                record.decode(lines);
                record.database = database;
            }

            return response.returnCode;
        }

        /**
         * Сохранение текстового файла на сервере.
         *
         * @param string $specification Спецификация файла
         * (включая текст файла).
         * @return bool
         */
        public writeTextFile(specification: string) : void {
            // TODO implement
        }
    }

}