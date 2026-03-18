import { useListQuestions, useGetStats, useDeleteQuestion, useResetQuestionStats } from "@workspace/api-client-react";
import { Link, useLocation } from "wouter";
import { Layout } from "@/components/Layout";
import { motion } from "framer-motion";
import { 
  CheckCircle2, 
  XCircle, 
  Play, 
  Shuffle, 
  Target, 
  Plus, 
  MoreVertical,
  Pencil,
  Trash2,
  RotateCcw,
  BookOpen
} from "lucide-react";
import * as DropdownMenu from "@radix-ui/react-dropdown-menu";
import { ConfirmDialog } from "@/components/ui/dialog-confirm";
import { useQueryClient } from "@tanstack/react-query";
import { getListQuestionsQueryKey, getGetStatsQueryKey } from "@workspace/api-client-react";

export default function Home() {
  const [, setLocation] = useLocation();
  const queryClient = useQueryClient();
  
  const { data: questions, isLoading: loadingQuestions } = useListQuestions();
  const { data: stats, isLoading: loadingStats } = useGetStats();
  
  const deleteMutation = useDeleteQuestion({
    mutation: {
      onSuccess: () => {
        queryClient.invalidateQueries({ queryKey: getListQuestionsQueryKey() });
        queryClient.invalidateQueries({ queryKey: getGetStatsQueryKey() });
      }
    }
  });

  const resetMutation = useResetQuestionStats({
    mutation: {
      onSuccess: () => {
        queryClient.invalidateQueries({ queryKey: getListQuestionsQueryKey() });
        queryClient.invalidateQueries({ queryKey: getGetStatsQueryKey() });
      }
    }
  });

  const hasQuestions = questions && questions.length > 0;
  const hasWrongQuestions = questions && questions.some(q => q.hasWrongAttempt);

  return (
    <Layout>
      <div className="space-y-10">
        
        {/* Stats & Actions Header */}
        <section className="flex flex-col md:flex-row gap-6 items-start md:items-center justify-between">
          <div className="space-y-1">
            <h1 className="text-3xl font-display font-bold text-foreground">学習の記録</h1>
            <p className="text-muted-foreground flex items-center gap-2">
              <BookOpen className="w-4 h-4" /> 
              全 {stats?.totalQuestions || 0} 問登録されています
            </p>
          </div>

          <div className="flex flex-wrap gap-3">
            <button 
              onClick={() => setLocation('/quiz?mode=all')}
              disabled={!hasQuestions}
              className="flex items-center gap-2 px-6 py-3 rounded-2xl bg-white border border-border shadow-sm hover:shadow-md hover:-translate-y-0.5 transition-all text-foreground font-medium disabled:opacity-50 disabled:pointer-events-none"
            >
              <Shuffle className="w-4 h-4 text-primary" />
              全問ランダム
            </button>
            <button 
              onClick={() => setLocation('/quiz?mode=wrong')}
              disabled={!hasWrongQuestions}
              className="flex items-center gap-2 px-6 py-3 rounded-2xl bg-primary text-primary-foreground shadow-lg shadow-primary/20 hover:shadow-xl hover:shadow-primary/30 hover:-translate-y-0.5 transition-all font-medium disabled:opacity-50 disabled:pointer-events-none"
            >
              <Target className="w-4 h-4" />
              間違えた問題のみ
            </button>
          </div>
        </section>

        {/* Stats Cards */}
        <section className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <motion.div 
            initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }}
            className="bg-card p-6 rounded-3xl border border-border shadow-sm flex items-center gap-4"
          >
            <div className="w-12 h-12 rounded-2xl bg-primary/10 flex items-center justify-center text-primary">
              <Play className="w-6 h-6" />
            </div>
            <div>
              <p className="text-sm text-muted-foreground font-medium">総挑戦回数</p>
              <p className="text-2xl font-bold font-display">{stats?.totalAttempts || 0} 回</p>
            </div>
          </motion.div>
          
          <motion.div 
            initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }}
            className="bg-card p-6 rounded-3xl border border-border shadow-sm flex items-center gap-4"
          >
            <div className="w-12 h-12 rounded-2xl bg-success/10 flex items-center justify-center text-success">
              <CheckCircle2 className="w-6 h-6" />
            </div>
            <div>
              <p className="text-sm text-muted-foreground font-medium">正解数</p>
              <p className="text-2xl font-bold font-display">{stats?.correctAttempts || 0} 回</p>
            </div>
          </motion.div>

          <motion.div 
            initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.3 }}
            className="bg-card p-6 rounded-3xl border border-border shadow-sm flex items-center gap-4"
          >
            <div className="w-12 h-12 rounded-2xl bg-destructive/10 flex items-center justify-center text-destructive">
              <XCircle className="w-6 h-6" />
            </div>
            <div>
              <p className="text-sm text-muted-foreground font-medium">復習が必要な問題</p>
              <p className="text-2xl font-bold font-display">{stats?.questionsWithWrongAttempts || 0} 問</p>
            </div>
          </motion.div>
        </section>

        {/* Question List */}
        <section className="space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-xl font-display font-bold">問題リスト</h2>
            <Link href="/questions/new" className="flex items-center gap-1 text-sm font-medium text-primary hover:text-primary/80 transition-colors">
              <Plus className="w-4 h-4" /> 新規作成
            </Link>
          </div>

          {loadingQuestions ? (
            <div className="py-20 text-center text-muted-foreground animate-pulse font-medium">
              読み込み中...
            </div>
          ) : !questions || questions.length === 0 ? (
            <div className="py-20 text-center bg-card rounded-3xl border border-border border-dashed flex flex-col items-center justify-center">
              <div className="w-16 h-16 bg-muted rounded-full flex items-center justify-center mb-4">
                <BookOpen className="w-8 h-8 text-muted-foreground" />
              </div>
              <h3 className="text-lg font-bold font-display mb-2">まだ問題がありません</h3>
              <p className="text-muted-foreground mb-6">最初の問題を登録して学習を始めましょう。</p>
              <Link href="/questions/new" className="px-6 py-3 rounded-xl bg-primary text-primary-foreground font-medium shadow-sm hover:bg-primary/90 transition-all">
                問題を作成する
              </Link>
            </div>
          ) : (
            <div className="grid gap-3">
              {questions.map((q, i) => (
                <motion.div 
                  initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.05 }}
                  key={q.id} 
                  className="group bg-card hover:bg-slate-50/50 p-4 md:p-5 rounded-2xl border border-border shadow-sm flex flex-col sm:flex-row sm:items-center justify-between gap-4 transition-all duration-200"
                >
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      {q.hasWrongAttempt && (
                        <span className="px-2 py-0.5 rounded-md bg-destructive/10 text-destructive text-xs font-bold shrink-0">
                          復習推奨
                        </span>
                      )}
                      <p className="font-medium text-foreground truncate">
                        {q.text.replace(/\{\{([^}]*)\}\}/g, '___')}
                      </p>
                    </div>
                  </div>
                  
                  <div className="flex items-center gap-6 shrink-0">
                    <div className="text-right">
                      <div className="text-xs text-muted-foreground font-medium mb-1">正答率</div>
                      <div className="text-sm font-bold font-display">
                        {q.totalAttempts > 0 
                          ? Math.round((q.correctAttempts / q.totalAttempts) * 100) 
                          : 0}% 
                        <span className="text-muted-foreground text-xs font-normal ml-1">
                          ({q.correctAttempts}/{q.totalAttempts})
                        </span>
                      </div>
                    </div>

                    <DropdownMenu.Root>
                      <DropdownMenu.Trigger asChild>
                        <button className="p-2 rounded-xl hover:bg-muted text-muted-foreground hover:text-foreground transition-colors outline-none">
                          <MoreVertical className="w-5 h-5" />
                        </button>
                      </DropdownMenu.Trigger>
                      <DropdownMenu.Portal>
                        <DropdownMenu.Content align="end" className="z-50 min-w-[180px] bg-card border border-border rounded-xl shadow-xl p-1 animate-in fade-in zoom-in-95 data-[side=bottom]:slide-in-from-top-2">
                          
                          <DropdownMenu.Item className="outline-none" asChild>
                            <Link href={`/questions/${q.id}/edit`} className="flex items-center gap-2 px-3 py-2 text-sm text-foreground hover:bg-muted rounded-lg cursor-pointer transition-colors">
                              <Pencil className="w-4 h-4" /> 編集する
                            </Link>
                          </DropdownMenu.Item>
                          
                          <ConfirmDialog 
                            title="学習記録をリセットしますか？"
                            description="この問題の正解数などの記録がゼロになります。この操作は取り消せません。"
                            onConfirm={() => resetMutation.mutate({ id: q.id })}
                            confirmText="リセット"
                            trigger={
                              <DropdownMenu.Item onSelect={(e) => e.preventDefault()} className="flex items-center gap-2 px-3 py-2 text-sm text-foreground hover:bg-muted rounded-lg cursor-pointer transition-colors outline-none">
                                <RotateCcw className="w-4 h-4" /> 記録をリセット
                              </DropdownMenu.Item>
                            }
                          />

                          <DropdownMenu.Separator className="h-px bg-border my-1" />
                          
                          <ConfirmDialog 
                            title="本当に削除しますか？"
                            description="この問題を削除します。この操作は取り消せません。"
                            onConfirm={() => deleteMutation.mutate({ id: q.id })}
                            confirmText="削除する"
                            variant="destructive"
                            trigger={
                              <DropdownMenu.Item onSelect={(e) => e.preventDefault()} className="flex items-center gap-2 px-3 py-2 text-sm text-destructive hover:bg-destructive/10 rounded-lg cursor-pointer transition-colors outline-none">
                                <Trash2 className="w-4 h-4" /> 削除する
                              </DropdownMenu.Item>
                            }
                          />

                        </DropdownMenu.Content>
                      </DropdownMenu.Portal>
                    </DropdownMenu.Root>
                  </div>
                </motion.div>
              ))}
            </div>
          )}
        </section>

      </div>
    </Layout>
  );
}
