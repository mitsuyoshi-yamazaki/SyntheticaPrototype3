// ---- コンパイル仕様 ---- //
// C言語 → Synthetica Script
// 変数はメモリへ格納、メモリの読み書きは絶対アドレッシング
// 変数型はすべて8bitのintもしくはunsigned intである
// ここでC言語のラベル表現として記述されているラベルのうち、template_で開始するラベル名のものはテンプレートアドレッシングのテンプレート（固定長8bitのテンプレートで、そのテンプレート値の16進数表現がテンプレート名となる 例：template_c5 は11000101というテンプレート）、そうでないものは絶対アドレッシングのメモリアドレスとして解釈せよ

// ---- ユニットAPI仕様 ---- //
// ユニットAPIとして表現される関数は、そのユニット種別のユニットを区別するためのインデックスを必ず第一引数に持つ。ユニットメモリに値を格納する関数は第二引数を持ち、返り値を持たない。ユニットメモリの値を読み出す関数は第二引数を持たず、返り値を持つ。

typedef unsigned int bool; // 0 | 1
typedef unsigned int unit; // HULL | ASSEMBLER | DISASSEMBLER | COMPUTER

#define NONE          0
#define HULL          1
#define ASSEMBLER     2
#define DISASSEMBLER  3
#define COMPUTER      4

#define UNIT_INDEX_NONE 255 // ユニットインデックスにおけるnull値

// HULL
unsigned int get_capacity(unsigned int hull_index);
unsigned int get_energy_amount(unsigned int hull_index);
void merge_hull(unsigned int hull_index, unsigned int to_hull_index); // hull_indexをto_hull_indexへマージ to_hull_indexの容量がhull_index分増える
void detach(unsigned int hull_index, unit detach_unit_type, unsigned int detach_unit_index);  // hull_indexから対象ユニットを分離する。分離したユニットはHULLの外部に出現する

// ASSEMBLER
/**
  unit_type: 生成するユニット種別
  connect_hull_index: 生成するユニットを接続するHULLのindex 接続しない場合はUNIT_INDEX_NONEを指定する
  第四引数以降: 生産するユニット種別ごとの生成パラメータ
 */
void assemble(unsigned int assembler_index, unit unit_type, unsigned int connect_hull_index, ...);
bool is_assembling(unsigned int assembler_index);
unit get_last_assembled_unit_type(unsigned int assembler_index); /// ユニット生成時、もしくはreset_last_assembled_unit()が呼ばれると値はNONEをとる
unsigned int get_last_assembled_unit_index(unsigned int assembler_index); /// ユニット生成時、もしくはreset_last_assembled_unit()が呼ばれると値はUNIT_INDEX_NONEをとる
void reset_last_assembled_unit(unsigned int assembler_index); /// get_last_assembled_unit_type()およびget_last_assembled_unit_index()で取得されるメモリ内容をリセット

// COMPUTER
// 自身のCOMPUTER操作
unsigned int read_my_memory(unsigned int memory_address);
unsigned int search_template(unsigned int template);  // C言語ではunsigned int値としてテンプレートが表現されているが、Synthetica Scriptにコンパイルすると、8bit値ではなくNOP0とNOP1で表されるテンプレートに展開される

// 他COMPUTERの操作
unsigned int read_computer_memory(unsigned int computer_index, unsigned int memory_address);
void write_computer_memory(unsigned int computer_index, unsigned int memory_address, unsigned int value);


// ---- アセンブラ オペコード値一覧 ---- //
#define ASSEMBLER_NOP0  0x00
#define ASSEMBLER_JMP   0x60
// 略


// ---- 自己複製コード本体 ---- //

// ※ ここでdefineしている値は仮のものであり、実際に必要となるcapacity等の値を求めて入れ替える必要がある
#define REPRODUCTION_HULL_CAPACITY  200
#define EXPAND_HULL_CAPACITY        20
#define CHILD_HULL_CAPACITY         100
#define CHILD_ASSEMBLER_POWER       20
#define CHILD_COMPUTER_CPU_FREQUENCY  10
#define CHILD_COMPUTER_MEMORY_SIZE  256

void main() { // C言語の作法としてmain()関数として実装しているが、Synthetica Scriptにコンパイルされるのは関数の内部の処理である

  // 接続している外部ユニットのindexは固定値（想定と異なる接続があれば意図しない挙動をするが、許容）

  while (1) {
    // 成長
    if (get_capacity(0) > REPRODUCTION_HULL_CAPACITY) {
      break;
    }

    // HULLの拡張
    reset_last_assembled_unit(0);
    assemble(0, HULL, EXPAND_HULL_CAPACITY);
    while (1) {
      if (!is_assembling(0)) {
        break;
      }
    }

    // assemble結果確認
    if (get_last_assembled_unit_type(0) == HULL) {
      merge_hull(get_last_assembled_unit_index(0), 0);
    }
    reset_last_assembled_unit(0);
  }

  while (1) {
    // 自己複製
    
    // 娘HULLの作成
    reset_last_assembled_unit(0);
    assemble(0, HULL, CHILD_HULL_CAPACITY);
    while (1) {
      if (!is_assembling(0)) {
        break;
      }
    }
    // assemble結果確認
    if (get_last_assembled_unit_type(0) != HULL) {
      // 何らかの原因でユニット生成に失敗したら生成物をパージする
      detach(0, get_last_assembled_unit_type(0), get_last_assembled_unit_index(0));
      continue;
    }
    unsigned int child_hull_index = get_last_assembled_unit_index(0);

    // 娘ASSEMBLERの作成
    reset_last_assembled_unit(0);
    assemble(0, ASSEMBLER, CHILD_ASSEMBLER_POWER);
    while (1) {
      if (!is_assembling(0)) {
        break;
      }
    }
    // assemble結果確認
    if (get_last_assembled_unit_type(0) != ASSEMBLER) {
      // 何らかの原因でユニット生成に失敗したら生成物をパージする
      detach(0, HULL, child_hull_index);
      continue;
    }

    // 娘COMPUTERの作成
    reset_last_assembled_unit(0);
    assemble(0, COMPUTER, CHILD_COMPUTER_CPU_FREQUENCY, CHILD_COMPUTER_MEMORY_SIZE);
    while (1) {
      if (!is_assembling(0)) {
        break;
      }
    }
    // assemble結果確認
    if (get_last_assembled_unit_type(0) != COMPUTER) {
      // 何らかの原因でユニット生成に失敗したら生成物をパージする
      detach(0, HULL, child_hull_index);
      continue;
    }

    // 娘COMPUTERへのメモリ書き込み
    // 書き込み中の中途半端なコードが実行されないように先頭に無限ループを書き込む
    write_computer_memory(1, 0, ASSEMBLER_JMP); // JMP命令は2バイト命令で、次バイトでJMP対象の指定をするが、次バイトはユニット生成直後で0になっている = JMP命令自身にジャンプするようになっているので、特に次バイトの書き換えは不要

    unsigned int memory_size = search_template(0xCC); // 終了テンプレート位置を検索（0xCCの補完テンプレートは0x55）
    for (unsigned int memory_address = 2; memory_address <= memory_size; memory_address++) {
      write_computer_memory(1, memory_address, read_my_memory(memory_address));
    }
    write_computer_memory(1, 0, ASSEMBLER_NOP0);  // プログラムカウンタを止めていた無限ループを解除

    // 娘エージェントの分離
    detach(0, HULL, child_hull_index);
  }
  template_55: // 終了テンプレート
}