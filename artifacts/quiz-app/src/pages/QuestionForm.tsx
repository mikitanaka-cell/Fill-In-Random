import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useCreateQuestion, useGetQuestion, useUpdateQuestion, getListQuestionsQueryKey } from "@workspace/api-client-react";
import { Link, useLocation, useParams } from "wouter";
import { Layout } from "@/components/Layout";
import { BlankRenderer } from "@/components/BlankRenderer";
import { ArrowLeft, Save, Loader2, Info } from "lucide-react";
import { useEffect } from "react";
import { useQueryClient } from "@tanstack/react-query";

const formSchema = z.object({
  title: z.string().min(1, "タイトルを入力してください").max(100),
  text: z.string()
    .min(1, "問題文を入力してください")
    .refine(val => val.includes("{{answer}}"), {
      message: "少なくとも1つの穴埋めプレースホルダー {{answer}} を含めてください"
    })
});

type FormValues = z.infer<typeof formSchema>;

export default function QuestionForm() {
  const { id } = useParams<{ id?: string }>();
  const isEditing = !!id;
  const numericId = id ? parseInt(id, 10) : 0;
  
  const [, setLocation] = useLocation();
  const queryClient = useQueryClient();

  const { data: existingQuestion, isLoading: isFetching } = useGetQuestion(numericId, {
    query: { enabled: isEditing }
  });

  const createMutation = useCreateQuestion({
    mutation: {
      onSuccess: () => {
        queryClient.invalidateQueries({ queryKey: getListQuestionsQueryKey() });
        setLocation("/");
      }
    }
  });

  const updateMutation = useUpdateQuestion({
    mutation: {
      onSuccess: () => {
        queryClient.invalidateQueries({ queryKey: getListQuestionsQueryKey() });
        setLocation("/");
      }
    }
  });

  const form = useForm<FormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      title: "",
      text: "",
    }
  });

  const watchText = form.watch("text");

  useEffect(() => {
    if (existingQuestion) {
      form.reset({
        title: existingQuestion.title,
        text: existingQuestion.text
      });
    }
  }, [existingQuestion, form]);

  const onSubmit = (data: FormValues) => {
    if (isEditing) {
      updateMutation.mutate({ id: numericId, data });
    } else {
      createMutation.mutate({ data });
    }
  };

  const isPending = createMutation.isPending || updateMutation.isPending;

  if (isEditing && isFetching) {
    return (
      <Layout>
        <div className="flex justify-center items-center h-64">
          <Loader2 className="w-8 h-8 animate-spin text-primary" />
        </div>
      </Layout>
    );
  }

  return (
    <Layout>
      <div className="max-w-3xl mx-auto w-full space-y-8">
        
        <div className="flex items-center gap-4">
          <Link href="/" className="w-10 h-10 rounded-full bg-white border border-border flex items-center justify-center text-muted-foreground hover:text-foreground hover:shadow-sm transition-all">
            <ArrowLeft className="w-5 h-5" />
          </Link>
          <h1 className="text-2xl font-display font-bold">
            {isEditing ? "問題を編集" : "新しい問題を作成"}
          </h1>
        </div>

        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-8">
          
          <div className="bg-card p-6 md:p-8 rounded-3xl border border-border shadow-sm space-y-6">
            
            {/* Title Field */}
            <div className="space-y-2">
              <label className="text-sm font-bold text-foreground">問題のタイトル</label>
              <input
                {...form.register("title")}
                className="w-full px-4 py-3 rounded-xl bg-background border-2 border-border focus:outline-none focus:border-primary focus:ring-4 focus:ring-primary/10 transition-all font-medium text-foreground"
                placeholder="例: 日本国憲法 第1条"
              />
              {form.formState.errors.title && (
                <p className="text-destructive text-sm font-medium mt-1">{form.formState.errors.title.message}</p>
              )}
            </div>

            {/* Text Field */}
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <label className="text-sm font-bold text-foreground">問題文</label>
                <div className="flex items-center gap-1.5 text-xs text-primary bg-primary/10 px-3 py-1 rounded-full font-medium">
                  <Info className="w-3.5 h-3.5" />
                  穴埋めにしたい部分を <code className="bg-white/50 px-1 rounded mx-1">&#123;&#123;answer&#125;&#125;</code> と記述します
                </div>
              </div>
              <textarea
                {...form.register("text")}
                rows={5}
                className="w-full px-4 py-3 rounded-xl bg-background border-2 border-border focus:outline-none focus:border-primary focus:ring-4 focus:ring-primary/10 transition-all font-medium text-foreground resize-y"
                placeholder="例: 天皇は、日本国の{{answer}}であり日本国民統合の{{answer}}であつて..."
              />
              {form.formState.errors.text && (
                <p className="text-destructive text-sm font-medium mt-1">{form.formState.errors.text.message}</p>
              )}
            </div>

          </div>

          {/* Live Preview */}
          {watchText && (
            <div className="bg-primary/5 p-6 md:p-8 rounded-3xl border border-primary/20 space-y-4">
              <h3 className="text-sm font-bold text-primary/70 tracking-widest uppercase">PREVIEW</h3>
              <div className="bg-white p-6 rounded-2xl shadow-sm border border-primary/10">
                <BlankRenderer text={watchText} mode="preview" />
              </div>
            </div>
          )}

          <div className="flex justify-end pt-4">
            <button
              type="submit"
              disabled={isPending}
              className="flex items-center gap-2 px-8 py-4 rounded-2xl font-bold bg-primary text-primary-foreground shadow-lg shadow-primary/25 hover:shadow-xl hover:shadow-primary/30 hover:-translate-y-0.5 active:translate-y-0 transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isPending ? <Loader2 className="w-5 h-5 animate-spin" /> : <Save className="w-5 h-5" />}
              {isEditing ? "更新を保存" : "問題を登録"}
            </button>
          </div>

        </form>
      </div>
    </Layout>
  );
}
