import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { motion } from "framer-motion";
import { Play, MessageSquare, Brain, CheckCircle, ArrowRight, Sparkles, Pause, PenTool } from "lucide-react";
import { AppNavBar } from "@/components/AppNavBar";

const features = [
  {
    icon: Pause,
    title: "Dừng thông minh tại điểm mấu chốt",
    desc: "AI phân tích video và tự động tạo câu hỏi tại những thời điểm quan trọng. Video tạm dừng, buộc học sinh suy nghĩ trước khi tiếp tục.",
  },
  {
    icon: MessageSquare,
    title: "Tương tác trực tiếp trong video",
    desc: "Câu hỏi trắc nghiệm và tự luận hiện ngay bên trong khung video — không cần rời khỏi bài giảng, không gián đoạn trải nghiệm.",
  },
  {
    icon: Brain,
    title: "AI chấm điểm & phản hồi tức thì",
    desc: "Học sinh nhận phản hồi ngay lập tức. AI đánh giá câu trả lời tự luận dựa trên rubric do giáo viên thiết lập.",
  },
  {
    icon: PenTool,
    title: "Giáo viên kiểm soát hoàn toàn",
    desc: "Chỉnh sửa câu hỏi, thời điểm xuất hiện, đáp án — tất cả trước khi xuất bản. AI gợi ý, giáo viên quyết định.",
  },
];

const steps = [
  { num: "01", title: "Upload video bài giảng", desc: "Kéo thả video vào hệ thống" },
  { num: "02", title: "AI tạo câu hỏi tương tác", desc: "Phân tích nội dung và đề xuất checkpoint" },
  { num: "03", title: "Giáo viên chỉnh sửa & xác nhận", desc: "Kiểm tra, sửa đổi và xuất bản" },
  { num: "04", title: "Học sinh học chủ động", desc: "Video tương tác sẵn sàng sử dụng" },
];

export default function Index() {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen bg-background">
      <AppNavBar />

      {/* Hero */}
      <section className="relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-br from-primary/5 via-transparent to-secondary/5" />
        <div className="relative max-w-5xl mx-auto px-6 pt-16 pb-20 text-center">
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
          >
            <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-secondary/10 text-secondary text-sm font-medium mb-6">
              <Sparkles className="h-4 w-4" />
              AI-Powered Interactive Video
            </div>

            <h1 className="text-4xl sm:text-5xl lg:text-6xl font-extrabold text-foreground leading-tight mb-5">
              Biến video bài giảng thành
              <br />
              <span className="text-secondary">trải nghiệm tương tác</span>
            </h1>

            <p className="text-lg text-muted-foreground max-w-2xl mx-auto mb-8 leading-relaxed">
              Tích hợp AI vào video giáo dục, cho phép học sinh <strong className="text-foreground">tương tác trực tiếp</strong> với nội dung thay vì chỉ xem thụ động. Câu hỏi xuất hiện ngay trong video, phản hồi tức thì, học tập chủ động.
            </p>

            <div className="flex flex-col sm:flex-row gap-3 justify-center">
              <Button
                size="lg"
                className="gradient-navy text-gold text-base px-8"
                onClick={() => navigate("/teacher")}
              >
                Bắt đầu tạo bài giảng
                <ArrowRight className="ml-2 h-5 w-5" />
              </Button>
              <Button
                size="lg"
                variant="outline"
                className="text-base px-8"
                onClick={() => navigate("/student")}
              >
                <Play className="mr-2 h-5 w-5" />
                Xem demo học sinh
              </Button>
            </div>
          </motion.div>
        </div>
      </section>

      {/* Problem Statement */}
      <section className="bg-card border-y border-border">
        <div className="max-w-4xl mx-auto px-6 py-14 text-center">
          <motion.div
            initial={{ opacity: 0 }}
            whileInView={{ opacity: 1 }}
            viewport={{ once: true }}
          >
            <p className="text-xl sm:text-2xl text-foreground font-semibold leading-relaxed">
              "70% học sinh <span className="text-destructive">không tập trung</span> khi xem video bài giảng dài hơn 6 phút."
            </p>
            <p className="text-muted-foreground mt-3 text-sm">
              Nghiên cứu EdTech cho thấy video xem thụ động có tỷ lệ ghi nhớ thấp. Tương tác là chìa khoá.
            </p>
          </motion.div>
        </div>
      </section>

      {/* Features */}
      <section className="max-w-5xl mx-auto px-6 py-16">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="text-center mb-12"
        >
          <h2 className="text-3xl font-bold text-foreground mb-3">AI làm gì trong video của bạn?</h2>
          <p className="text-muted-foreground">Không chỉ là video + quiz. Đây là trải nghiệm học tập thông minh.</p>
        </motion.div>

        <div className="grid sm:grid-cols-2 gap-6">
          {features.map((f, i) => (
            <motion.div
              key={f.title}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: i * 0.1 }}
              className="rounded-xl border border-border bg-card p-6 hover:border-secondary/40 transition-colors"
            >
              <div className="h-10 w-10 rounded-lg bg-secondary/10 flex items-center justify-center mb-4">
                <f.icon className="h-5 w-5 text-secondary" />
              </div>
              <h3 className="font-semibold text-foreground mb-2">{f.title}</h3>
              <p className="text-sm text-muted-foreground leading-relaxed">{f.desc}</p>
            </motion.div>
          ))}
        </div>
      </section>

      {/* How it works */}
      <section className="bg-card border-y border-border">
        <div className="max-w-4xl mx-auto px-6 py-16">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="text-center mb-12"
          >
            <h2 className="text-3xl font-bold text-foreground mb-3">Cách hoạt động</h2>
            <p className="text-muted-foreground">Từ video thô đến bài giảng tương tác chỉ trong 4 bước</p>
          </motion.div>

          <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-6">
            {steps.map((s, i) => (
              <motion.div
                key={s.num}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: i * 0.1 }}
                className="text-center"
              >
                <div className="text-3xl font-black text-secondary/30 mb-2">{s.num}</div>
                <h4 className="font-semibold text-foreground text-sm mb-1">{s.title}</h4>
                <p className="text-xs text-muted-foreground">{s.desc}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="max-w-3xl mx-auto px-6 py-16 text-center">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
        >
          <h2 className="text-2xl sm:text-3xl font-bold text-foreground mb-4">
            Sẵn sàng biến video thành công cụ dạy học thông minh?
          </h2>
          <p className="text-muted-foreground mb-6">
            Bắt đầu miễn phí. Upload video đầu tiên và để AI tạo bài giảng tương tác.
          </p>
          <Button
            size="lg"
            className="gradient-navy text-gold text-base px-10"
            onClick={() => navigate("/teacher")}
          >
            Tạo bài giảng ngay
            <ArrowRight className="ml-2 h-5 w-5" />
          </Button>
        </motion.div>
      </section>

      {/* Footer */}
      <footer className="border-t border-border py-6 text-center text-xs text-muted-foreground">
        VinSchool AI Interactive Video Platform · Powered by AI
      </footer>
    </div>
  );
}
